import { describe, expect, it, vi } from 'vitest'

/**
 * WebSocket 状态不能被「上一个连接的迟到事件」改写。
 *
 * 背景：`connect()` 会先 close 旧客户端再建新的。浏览器的 close 事件是异步派发的，
 * 可能在新连接已经建立之后才到达；旧客户端的处理器若照常写状态，就会把
 * 「已连接」覆盖成「已断开」（真实复现过）。这里把三条防线钉住：
 *   1. 手动关闭后，close/error 事件不再上报状态；
 *   2. close() 解绑状态回调；
 *   3. 模块级状态只接受「当前客户端」的上报。
 */

const sockets: FakeSocket[] = []

class FakeSocket {
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null
  onerror: ((error: unknown) => void) | null = null
  readonly url: string
  constructor(url: string) {
    this.url = url
    sockets.push(this)
  }
  send() {}
  close() {}
}

// @ts-expect-error 测试替身，只需覆盖被用到的成员
globalThis.WebSocket = FakeSocket

vi.mock('@@/utils/cache/cookies', () => ({ getToken: () => 'review-token' }))

import { useWebSocket } from '@/common/composables/useWebSocket'
import { WsStatus } from '@/common/utils/webSocket'

describe('WebSocket 状态与会话', () => {
  it('旧连接迟到的 close 不会把新连接改成断开', () => {
    const ws = useWebSocket()

    ws.connect('token-a')
    const first = sockets[sockets.length - 1]
    first.onopen?.()
    expect(ws.status.value).toBe(WsStatus.CONNECTED)

    // 重新连接：旧客户端被 close，新客户端建立
    ws.connect('token-b')
    const second = sockets[sockets.length - 1]
    expect(sockets.length).toBe(2)
    second.onopen?.()
    expect(ws.status.value).toBe(WsStatus.CONNECTED)

    // 旧连接的 close 事件这时才被浏览器派发
    first.onclose?.({ code: 1000 })
    expect(ws.status.value, '旧连接把新连接覆盖成断开了').toBe(WsStatus.CONNECTED)

    // 错误事件同理
    first.onerror?.(new Error('boom'))
    expect(ws.status.value, '旧连接的错误事件污染了状态').toBe(WsStatus.CONNECTED)
  })

  it('新连接自身的 close 仍然能正常上报断开', () => {
    const ws = useWebSocket()
    ws.connect('token-c')
    const client = sockets[sockets.length - 1]
    client.onopen?.()
    expect(ws.status.value).toBe(WsStatus.CONNECTED)

    // 非手动关闭（如网络中断）：应当上报断开并进入重连，而不是停留在「已连接」
    client.onclose?.({ code: 1006 })
    expect(ws.status.value).not.toBe(WsStatus.CONNECTED)
  })

  it('主动关闭后状态为断开', () => {
    const ws = useWebSocket()
    ws.connect('token-d')
    sockets[sockets.length - 1].onopen?.()
    expect(ws.status.value).toBe(WsStatus.CONNECTED)

    ws.close()
    expect(ws.status.value).toBe(WsStatus.DISCONNECTED)
  })
})
