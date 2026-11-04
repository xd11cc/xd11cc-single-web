import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onlineUserList } from '@/views/system/onlineUser/apis'
import type { OnlineUserVO } from '@/views/system/onlineUser/apis/type'
import type { ResponseVO } from 'types/api'

const { user, on, off, sendMessage } = vi.hoisted(() => ({
  user: { userId: 101, username: 'user-A' },
  on: vi.fn(),
  off: vi.fn(),
  sendMessage: vi.fn(),
}))

vi.mock('@/pinia/stores/user', () => ({ useUserStore: () => user }))
vi.mock('@@/composables/useWebSocket', () => ({
  useWebSocket: () => ({ on, off, sendMessage }),
}))
vi.mock('@/views/system/onlineUser/apis', () => ({ onlineUserList: vi.fn() }))

let useChat: (typeof import('@/common/composables/useChat'))['useChat']

function deferred<Value>() {
  let resolve!: (value: Value) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function onlineResponse(rows: OnlineUserVO[]): ResponseVO<OnlineUserVO[]> {
  return { code: 200, msg: 'ok', data: rows }
}

function deliverMessage(text = '收到的消息') {
  const handler = on.mock.calls[0][1]
  handler({ type: 'CHAT', text, timestamp: 123 }, { from: { userId: 999, username: 'contact' } })
}

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  user.userId = 101
  user.username = 'user-A'
  sendMessage.mockReset().mockReturnValue(true)
  vi.mocked(onlineUserList).mockReset().mockResolvedValue(onlineResponse([]))
  const chatModule = await import('@/common/composables/useChat')
  useChat = chatModule.useChat
})

describe('useChat 简单会话隔离', () => {
  it('销毁清空消息、联系人、未读、选中项和面板，并取消原监听', () => {
    const chat = useChat()
    chat.init()
    deliverMessage()
    expect(chat.totalUnread.value).toBe(1)
    chat.openChat(999, 'contact')
    chat.send(999, '发送的消息')
    chat.panelVisible.value = false
    deliverMessage('另一条消息')
    chat.panelVisible.value = true
    expect(chat.getMessages(999)).toHaveLength(3)
    expect(chat.activeContactId.value).toBe(999)

    chat.destroy()
    expect(chat.getMessages(999)).toEqual([])
    expect(chat.contacts.value).toEqual([])
    expect(chat.totalUnread.value).toBe(0)
    expect(chat.activeContactId.value).toBeNull()
    expect(chat.panelVisible.value).toBe(false)
    expect(off).toHaveBeenCalledWith('BUSINESS', on.mock.calls[0][1])
  })

  it('A 退出后 B 使用同一模块不会读到 A 的消息', () => {
    const first = useChat()
    first.init()
    first.openChat(999, 'contact')
    first.send(999, 'private-message-from-A')
    first.destroy()
    user.userId = 202
    user.username = 'user-B'
    const second = useChat()
    second.init()

    expect(second.getMessages(999)).toEqual([])
    expect(second.contacts.value).toEqual([])
    expect(second.panelVisible.value).toBe(false)
    expect(second.activeContactId.value).toBeNull()
    expect(on).toHaveBeenCalledTimes(2)
  })

  it('未初始化和重复销毁也会清理数据，不重复取消监听', () => {
    const chat = useChat()
    chat.openChat(999, 'contact')
    chat.send(999, 'temporary-message')
    chat.destroy()
    chat.destroy()
    expect(chat.getMessages(999)).toEqual([])
    expect(chat.contacts.value).toEqual([])
    expect(chat.panelVisible.value).toBe(false)
    expect(off).not.toHaveBeenCalled()
  })

  it('同一会话的多个调用方仍共享聊天数据，重复初始化不重复订阅', () => {
    const first = useChat()
    const second = useChat()
    first.init()
    second.init()
    first.openChat(999, 'contact')
    first.send(999, 'shared-message')
    expect(second.getMessages(999)[0].text).toBe('shared-message')
    expect(second.panelVisible.value).toBe(true)
    expect(on).toHaveBeenCalledTimes(1)
  })

  it('子面板先查询、父级后初始化时，当前会话响应仍可正常使用', async () => {
    const pending = deferred<ResponseVO<OnlineUserVO[]>>()
    vi.mocked(onlineUserList).mockReturnValueOnce(pending.promise)
    const chat = useChat()
    const request = chat.refreshOnlineUsers()
    chat.init()
    pending.resolve(onlineResponse([{ userId: 999, username: 'contact' }]))
    await request
    expect(chat.contacts.value).toEqual([
      { userId: 999, username: 'contact', unread: 0, online: true },
    ])
  })

  it('销毁后的在线列表迟到，不重新填入已清空的联系人', async () => {
    const pending = deferred<ResponseVO<OnlineUserVO[]>>()
    vi.mocked(onlineUserList).mockReturnValueOnce(pending.promise)
    const chat = useChat()
    chat.init()
    const request = chat.refreshOnlineUsers()
    chat.destroy()
    pending.resolve(onlineResponse([{ userId: 999, username: 'old-contact' }]))
    await request
    expect(chat.contacts.value).toEqual([])
  })

  it('同一账号销毁后重新初始化，旧列表响应同样失效', async () => {
    const pending = deferred<ResponseVO<OnlineUserVO[]>>()
    vi.mocked(onlineUserList).mockReturnValueOnce(pending.promise)
    const chat = useChat()
    chat.init()
    const request = chat.refreshOnlineUsers()
    chat.destroy()
    chat.init()
    pending.resolve(onlineResponse([{ userId: 999, username: 'old-contact' }]))
    await request
    expect(chat.contacts.value).toEqual([])
  })

  it('B 的在线列表先完成后，A 的迟到列表不能清空或覆盖 B 联系人', async () => {
    const older = deferred<ResponseVO<OnlineUserVO[]>>()
    vi.mocked(onlineUserList).mockReturnValueOnce(older.promise)
    const first = useChat()
    first.init()
    const oldRequest = first.refreshOnlineUsers()
    first.destroy()
    user.userId = 202
    user.username = 'user-B'
    const second = useChat()
    second.init()
    vi.mocked(onlineUserList).mockResolvedValueOnce(
      onlineResponse([{ userId: 888, username: 'B-contact' }]),
    )
    await second.refreshOnlineUsers()
    older.resolve(onlineResponse([]))
    await oldRequest
    expect(second.contacts.value).toEqual([
      { userId: 888, username: 'B-contact', unread: 0, online: true },
    ])
  })

  it('账号身份已改变但布局尚未销毁时，不接收前账号的列表', async () => {
    const pending = deferred<ResponseVO<OnlineUserVO[]>>()
    vi.mocked(onlineUserList).mockReturnValueOnce(pending.promise)
    const chat = useChat()
    chat.init()
    const request = chat.refreshOnlineUsers()
    user.userId = 0
    pending.resolve(onlineResponse([{ userId: 999, username: 'old-contact' }]))
    await request
    expect(chat.contacts.value).toEqual([])
  })

  it('在线列表失败不拒绝；当前会话的历史离线联系人继续保留', async () => {
    const chat = useChat()
    chat.init()
    chat.openChat(999, 'contact')
    chat.send(999, 'history')
    vi.mocked(onlineUserList).mockRejectedValueOnce(new Error('offline'))
    await expect(chat.refreshOnlineUsers()).resolves.toBeUndefined()
    expect(chat.getMessages(999)[0].text).toBe('history')
    await chat.refreshOnlineUsers()
    expect(chat.contacts.value[0].online).toBe(false)
    expect(chat.getMessages(999)).toHaveLength(1)
  })

  it('旧会话查询失败不影响新会话联系人，也不遗留拒绝', async () => {
    const pending = deferred<ResponseVO<OnlineUserVO[]>>()
    vi.mocked(onlineUserList).mockReturnValueOnce(pending.promise)
    const chat = useChat()
    chat.init()
    const request = chat.refreshOnlineUsers()
    chat.destroy()
    chat.init()
    chat.openChat(888, 'new-contact')
    pending.reject(new Error('stale failure'))
    await expect(request).resolves.toBeUndefined()
    expect(chat.contacts.value[0].userId).toBe(888)
  })

  it('当前会话收发保持原契约，发送失败不记录消息', () => {
    const chat = useChat()
    chat.init()
    chat.openChat(999, 'contact')
    expect(chat.send(999, 'hello')).toBe(true)
    expect(sendMessage).toHaveBeenCalledWith({
      userId: 999,
      data: { type: 'CHAT', text: 'hello', timestamp: expect.any(Number) },
    })
    sendMessage.mockReturnValueOnce(false)
    expect(chat.send(999, 'failed')).toBe(false)
    expect(chat.getMessages(999)).toHaveLength(1)
    deliverMessage('reply')
    expect(chat.getMessages(999)[1].isSelf).toBe(false)
    expect(chat.totalUnread.value).toBe(0)
  })
})
