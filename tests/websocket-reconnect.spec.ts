import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * 同一个 WebSocketClient 内部重连时，旧 socket 的迟到事件不能影响当前 socket。
 *
 * `initConnect()` 会把新的 WebSocket 赋给 `this.ws`，但上一次的 socket 对象仍然
 * 带着回调闭包。如果不在赋值前解绑、并在回调里核对「我还是不是当前 socket」，
 * 旧 socket 迟到的 close 就会清掉新 socket 的心跳、把状态改成断开、并再排一次重连。
 */

const sockets: FakeSocket[] = []

class FakeSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null
  onerror: ((error: unknown) => void) | null = null
  readyState = FakeSocket.CONNECTING
  readonly url: string
  constructor(url: string) {
    this.url = url
    sockets.push(this)
  }
  send() {}
  close() {
    this.readyState = FakeSocket.CLOSED
  }
}

// @ts-expect-error 测试替身
globalThis.WebSocket = FakeSocket

import { WebSocketClient, WsStatus } from '@/common/utils/webSocket'

function makeClient(onStatus = vi.fn()) {
  const client = new WebSocketClient(
    { url: 'ws://localhost/ws', heartbeatInterval: 25000, reconnectInterval: 5000 },
    'review-token',
    onStatus,
  )
  return client
}

/** 让页面可见性监听认为「页面刚刚重新变为可见」 */
function showPage() {
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  sockets.splice(0)
})

describe('WebSocketClient 内部重连', () => {
  it('旧 socket 迟到的 close 不应影响当前 socket 的状态', () => {
    const client = makeClient()
    client.initConnect()
    const first = sockets[0]
    first.readyState = FakeSocket.OPEN
    first.onopen?.()
    expect(client.getStatus()).toBe(WsStatus.CONNECTED)

    // 连接异常后页面重新可见：可见性监听会再 initConnect 一次
    first.onerror?.(new Error('network'))
    first.readyState = FakeSocket.CLOSING
    showPage()
    const second = sockets[1]
    expect(second, '可见性监听没有建立新连接').toBeTruthy()
    second.readyState = FakeSocket.OPEN
    second.onopen?.()
    expect(client.getStatus()).toBe(WsStatus.CONNECTED)

    // 旧 socket 的 close 事件这时才到（此时它的 readyState 已是 CLOSED）
    first.readyState = FakeSocket.CLOSED
    first.onclose?.({ code: 1006 })

    expect(client.getStatus(), '旧 socket 的 close 把新连接改成了断开').toBe(WsStatus.CONNECTED)
    client.close()
  })

  it('旧 socket 迟到的 error 不应影响当前 socket 的状态', () => {
    const client = makeClient()
    client.initConnect()
    const first = sockets[0]
    first.readyState = FakeSocket.OPEN
    first.onopen?.()

    first.readyState = FakeSocket.CLOSING
    client.initConnect()
    const second = sockets[1]
    second.readyState = FakeSocket.OPEN
    second.onopen?.()
    expect(client.getStatus()).toBe(WsStatus.CONNECTED)

    first.readyState = FakeSocket.CLOSED
    first.onerror?.(new Error('late'))
    expect(client.getStatus(), '旧 socket 的 error 把新连接改成了断开').toBe(WsStatus.CONNECTED)
    client.close()
  })

  it('4001 等终止性关闭之后，页面重新可见不应再自动连接', () => {
    const client = makeClient()
    client.initConnect()
    const first = sockets[0]
    first.readyState = FakeSocket.OPEN
    first.onopen?.()

    // 服务端明确拒绝（token 失效）：不安排重连
    first.readyState = FakeSocket.CLOSED
    first.onclose?.({ code: 4001 })
    expect(client.getStatus()).toBe(WsStatus.DISCONNECTED)
    expect(sockets.length).toBe(1)

    // 用户切走再切回来
    showPage()

    expect(sockets.length, '终止性关闭后仍被可见性监听重新连接').toBe(1)
    client.close()
  })
})
