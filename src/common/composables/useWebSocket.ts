import { WebSocketClient, WsStatus } from '@@/utils/webSocket'
import type { NettyMessageDTO } from '@@/utils/webSocket'
import { getToken } from '@@/utils/cache/cookies'

const BASE_WS_URL = import.meta.env.VITE_WS_URL + import.meta.env.VITE_WS_PATH

const status = ref<WsStatus>(WsStatus.DISCONNECTED)
const lastMessage = ref<NettyMessageDTO | null>(null)
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

    wsClient.onMessage((data: NettyMessageDTO) => {
      lastMessage.value = data
      ElMessageBox.alert(data.content, '新消息提醒', {
        confirmButtonText: '确认',
        type: 'info',
        dangerouslyUseHTMLString: true,
      })
    })

    wsClient.initConnect()
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

  return {
    status: readonly(status),
    lastMessage: readonly(lastMessage),
    connect,
    close,
    sendMessage,
  }
}
