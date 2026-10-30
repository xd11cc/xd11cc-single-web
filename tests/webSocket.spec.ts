import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  WebSocketClient,
  WsStatus,
  getWebSocket,
  initWebSocketInstance,
  resetWebSocketInstance,
} from '@@/utils/webSocket'

/**
 * WebSocketClient 的接口测试。
 *
 * 这是纯状态机（连接 / 心跳 / 重连 / 分发），不依赖 UI，
 * 用假的 WebSocket 构造器手动驱动 onopen / onmessage / onclose 即可。
 */

class FakeWebSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  static instances: FakeWebSocket[] = []

  readyState = FakeWebSocket.CONNECTING
  sent: string[] = []
  closedWith: { code?: number; reason?: string } | null = null
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null
  onerror: ((error: unknown) => void) | null = null

  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }

  send(payload: string) {
    this.sent.push(payload)
  }

  close(code?: number, reason?: string) {
    this.closedWith = { code, reason }
    this.readyState = FakeWebSocket.CLOSED
    this.onclose?.({ code: code ?? 1000 })
  }

  // ── 测试驱动用 ──
  simulateOpen() {
    this.readyState = FakeWebSocket.OPEN
    this.onopen?.()
  }

  simulateMessage(data: string) {
    this.onmessage?.({ data })
  }

  simulateClose(code: number) {
    this.readyState = FakeWebSocket.CLOSED
    this.onclose?.({ code })
  }
}

const latest = () => FakeWebSocket.instances.at(-1)!

// 每个 client 都会往 document 上挂 visibilitychange 监听；不统一关闭会跨用例互相干扰
const createdClients: WebSocketClient[] = []

function createClient(overrides: Record<string, any> = {}) {
  const statuses: WsStatus[] = []
  const client = new WebSocketClient(
    { url: 'ws://localhost/ws', heartbeatInterval: 1000, reconnectInterval: 100, maxReconnectTimes: 2, reconnectBackoff: 2, ...overrides },
    'token-1',
    (s) => statuses.push(s),
  )
  createdClients.push(client)
  return { client, statuses }
}

describe('WebSocketClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  afterEach(() => {
    createdClients.splice(0).forEach((c) => c.close())
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('initConnect 用 token 拼出连接地址并进入 CONNECTING', () => {
    const { client, statuses } = createClient()
    client.initConnect()

    expect(latest().url).toBe('ws://localhost/ws?token=token-1')
    expect(client.getStatus()).toBe(WsStatus.CONNECTING)
    expect(statuses).toEqual([WsStatus.CONNECTING])
  })

  it('token 缺失时不建立连接', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { client } = createClient()
    ;(client as any).token = null
    client.initConnect()

    expect(FakeWebSocket.instances).toHaveLength(0)
    expect(errors).toHaveBeenCalledWith('[WebSocket] 认证token不能为空')
  })

  it('onopen 后状态变为 CONNECTED', () => {
    const { client, statuses } = createClient()
    client.initConnect()
    latest().simulateOpen()

    expect(client.getStatus()).toBe(WsStatus.CONNECTED)
    expect(statuses).toEqual([WsStatus.CONNECTING, WsStatus.CONNECTED])
  })

  it('连接后按心跳间隔发送 PING', () => {
    const { client } = createClient()
    client.initConnect()
    latest().simulateOpen()

    vi.advanceTimersByTime(3000)

    expect(latest().sent).toEqual(['PING', 'PING', 'PING'])
  })

  it('收到 PING 时回 PONG，收到 PONG 时不派发', () => {
    const { client } = createClient()
    const received = vi.fn()
    client.on('*', received)
    client.initConnect()
    latest().simulateOpen()

    latest().simulateMessage('PING')
    latest().simulateMessage('PONG')

    expect(latest().sent).toContain('PONG')
    expect(received).not.toHaveBeenCalled()
  })

  it('按 action 分发并把完整信封作为第二个参数', () => {
    const { client } = createClient()
    const handler = vi.fn()
    client.on('NEW_NOTICE', handler)
    client.initConnect()
    latest().simulateOpen()

    const envelope = { action: 'NEW_NOTICE', from: null, data: { noticeId: 1 } }
    latest().simulateMessage(JSON.stringify(envelope))

    expect(handler).toHaveBeenCalledWith({ noticeId: 1 }, envelope)
  })

  it('通配符 * 收到整个信封', () => {
    const { client } = createClient()
    const wildcard = vi.fn()
    client.on('*', wildcard)
    client.initConnect()
    latest().simulateOpen()

    const envelope = { action: 'ANY', data: 'x' }
    latest().simulateMessage(JSON.stringify(envelope))

    expect(wildcard).toHaveBeenCalledWith(envelope)
  })

  it('无 action 的消息只告警不派发', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { client } = createClient()
    const wildcard = vi.fn()
    client.on('*', wildcard)
    client.initConnect()
    latest().simulateOpen()

    latest().simulateMessage(JSON.stringify({ data: 'x' }))

    expect(wildcard).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()
  })

  it('非法 JSON 只记录错误，不影响后续消息', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { client } = createClient()
    const handler = vi.fn()
    client.on('OK', handler)
    client.initConnect()
    latest().simulateOpen()

    latest().simulateMessage('不是 JSON')
    latest().simulateMessage(JSON.stringify({ action: 'OK', data: 1 }))

    expect(error).toHaveBeenCalled()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('sendMessage 仅在已连接且 OPEN 时发送', () => {
    const { client } = createClient()
    expect(client.sendMessage({ userId: 1, data: 'x' })).toBe(false)

    client.initConnect()
    latest().simulateOpen()

    expect(client.sendMessage({ userId: 1, data: 'x' })).toBe(true)
    expect(latest().sent).toContain(JSON.stringify({ userId: 1, data: 'x' }))
  })

  it('send 抛错时返回 false 而不是向上冒泡', () => {
    const { client } = createClient()
    client.initConnect()
    const socket = latest()
    socket.simulateOpen()
    vi.spyOn(socket, 'send').mockImplementation(() => {
      throw new Error('boom')
    })

    expect(client.sendMessage({ userId: 1, data: 'x' })).toBe(false)
  })

  it('异常关闭（1006）触发指数退避重连', () => {
    const { client } = createClient({ reconnectInterval: 100, reconnectBackoff: 2 })
    client.initConnect()
    latest().simulateOpen()

    latest().simulateClose(1006)
    expect(client.getStatus()).toBe(WsStatus.RECONNECTING)

    // 第一次退避 100ms
    vi.advanceTimersByTime(99)
    expect(FakeWebSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(2)
  })

  it('正常关闭 / 鉴权失败不重连', () => {
    for (const code of [1000, 1008, 4001]) {
      FakeWebSocket.instances = []
      const { client } = createClient()
      client.initConnect()
      latest().simulateOpen()

      latest().simulateClose(code)
      vi.advanceTimersByTime(10_000)

      expect(FakeWebSocket.instances).toHaveLength(1)
      expect(client.getStatus()).toBe(WsStatus.DISCONNECTED)
    }
  })

  it('达到最大重连次数后停止重连', () => {
    const { client } = createClient({ maxReconnectTimes: 2, reconnectInterval: 10 })
    client.initConnect()

    // 每次都异常关闭，推进到重连上限
    for (let i = 0; i < 5; i++) {
      latest().simulateClose(1006)
      vi.advanceTimersByTime(1000)
    }

    // 初始 1 次 + 最多 2 次重连
    expect(FakeWebSocket.instances.length).toBeLessThanOrEqual(3)
  })

  it('close 是手动关闭：不重连且清空订阅', () => {
    const { client } = createClient()
    const handler = vi.fn()
    client.on('X', handler)
    client.initConnect()
    latest().simulateOpen()

    client.close()
    vi.advanceTimersByTime(10_000)

    expect(client.getStatus()).toBe(WsStatus.DISCONNECTED)
    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(latest().closedWith?.code).toBe(1000)

    // 订阅已清空
    client.initConnect()
    latest().simulateOpen()
    latest().simulateMessage(JSON.stringify({ action: 'X', data: 1 }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('页面重新可见时，断线连接会立即重连', () => {
    const { client } = createClient({ reconnectInterval: 10_000 })
    client.initConnect()
    latest().simulateOpen()
    expect(FakeWebSocket.instances).toHaveLength(1)

    // 异常断开：进入 RECONNECTING，但退避间隔很长（10s），此时还没重连
    latest().simulateClose(1006)
    expect(client.getStatus()).toBe(WsStatus.RECONNECTING)
    expect(FakeWebSocket.instances).toHaveLength(1)

    // 标签页重新可见 → 不等退避，立即重连
    document.dispatchEvent(new Event('visibilitychange'))
    expect(FakeWebSocket.instances).toHaveLength(2)
  })

  it('手动关闭后，页面重新可见不会再重连', () => {
    const { client } = createClient()
    client.initConnect()
    latest().simulateOpen()
    client.close()

    document.dispatchEvent(new Event('visibilitychange'))
    expect(FakeWebSocket.instances).toHaveLength(1)
  })
})

describe('WebSocket 单例管理', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
    resetWebSocketInstance()
  })

  afterEach(() => {
    resetWebSocketInstance()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('重复初始化会关闭上一个连接', () => {
    const first = initWebSocketInstance('t1')
    first.initConnect()
    const second = initWebSocketInstance('t2')
    second.initConnect()

    expect(first).not.toBe(second)
    expect(getWebSocket()).toBe(second)
    expect(FakeWebSocket.instances).toHaveLength(2)
  })

  it('reset 后 getWebSocket 返回 null', () => {
    initWebSocketInstance('t1')
    resetWebSocketInstance()

    expect(getWebSocket()).toBeNull()
  })
})
