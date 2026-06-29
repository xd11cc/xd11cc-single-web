import { WebSocketClient, WsStatus } from '@@/utils/webSocket'
import type { WsPushMessage, NettyMessageDTO } from '@@/utils/webSocket'
import { getToken } from '@@/utils/cache/cookies'

const BASE_WS_URL = import.meta.env.VITE_WS_URL + import.meta.env.VITE_WS_PATH

const status = ref<WsStatus>(WsStatus.DISCONNECTED)
const lastMessage = ref<WsPushMessage | null>(null)
let wsClient: WebSocketClient | null = null

export function useWebSocket() {
  const connect = (token?: string) => {
    const resolvedToken = token || (getToken() as string)
    if (!resolvedToken) {
      console.error('[useWebSocket] No token available')
      return
    }

    if (wsClient) {
      wsClient.close()
      wsClient = null
    }

    wsClient = new WebSocketClient(
      {
        url: BASE_WS_URL,
        heartbeatInterval: 25000,
        reconnectInterval: 5000,
        maxReconnectTimes: 10,
        reconnectBackoff: 1.5,
      },
      resolvedToken,
      (newStatus) => {
        status.value = newStatus
      },
    )

    // 全局消息监听（记录最后一条消息）
    wsClient.on('*', (message: WsPushMessage) => {
      lastMessage.value = message
    })

    wsClient.initConnect()
  }

  /**
   * 订阅指定 action 的消息
   */
  const on = (action: string, callback: (data: any) => void) => {
    wsClient?.on(action, callback)
  }

  /**
   * 取消订阅
   */
  const off = (action: string, callback?: (data: any) => void) => {
    wsClient?.off(action, callback)
  }

  const sendMessage = (data: NettyMessageDTO): boolean => {
    if (!wsClient) return false
    return wsClient.sendMessage(data)
  }

  const close = () => {
    if (wsClient) {
      wsClient.close()
      wsClient = null
    }
    status.value = WsStatus.DISCONNECTED
  }

  const getClient = () => wsClient

  return {
    status: readonly(status),
    lastMessage: readonly(lastMessage),
    connect,
    close,
    sendMessage,
    on,
    off,
    getClient,
  }
}
