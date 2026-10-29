import { WebSocketClient, WsStatus } from '@@/utils/webSocket'
import type { WsPushMessage, NettyMessageDTO } from '@@/utils/webSocket'
import { getToken } from '@@/utils/cache/cookies'
import { ElMessage } from 'element-plus'

/**
 * WebSocket 连接地址。
 * <p>
 * VITE_WS_URL 为空时按当前页面协议与主机推导（同源），
 * 由 Vite 的 proxy ws:true 转发到后端 Netty 端口；
 * 配置了完整地址则直接使用（生产环境通常独立域名）。
 * </p>
 */
const WS_PATH = import.meta.env.VITE_WS_PATH
const WS_ORIGIN =
  import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
const BASE_WS_URL = WS_ORIGIN + WS_PATH

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

    // 服务端错误帧统一提示；后端已改为 JSON 信封，不再有裸文本错误
    wsClient.on('ERROR', (data: { message?: string }) => {
      ElMessage.warning(data?.message || 'WebSocket 请求失败')
    })

    wsClient.initConnect()
  }

  /**
   * 订阅指定 action 的消息
   */
  const on = (action: string, callback: (data: any, message?: WsPushMessage) => void) => {
    wsClient?.on(action, callback)
  }

  /**
   * 取消订阅
   */
  const off = (action: string, callback?: (data: any, message?: WsPushMessage) => void) => {
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
