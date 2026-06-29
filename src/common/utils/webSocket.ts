// 后端 WsPushMessage 统一信封格式
export interface WsPushMessage {
  action: string
  data: any
}

// 后端 NettyMessageDTO 对应 TS 类型（action=BUSINESS 时的 data）
export interface NettyMessageDTO {
  webSocketEnum: 'USER' | 'TENANT' | 'GLOBAL'
  userId?: number
  tenantId?: number
  content: string
}

// 通知推送 DTO（action=NEW_NOTICE/REVOKE_NOTICE 时的 data）
export interface NoticeWebSocketDTO {
  action: string
  noticeId: number
  title?: string
  type?: number // 1-通知 2-消息 3-待办
  senderName?: string
  sendTime?: string
}

// WebSocket 关闭码枚举
enum WsCloseCode {
  NORMAL_CLOSURE = 1000,
  POLICY_VIOLATION = 1008,
  INVALID_TOKEN = 4001,
  ABNORMAL_CLOSURE = 1006,
}

// webSocket配置项接口
export interface WsConfig {
  url: string
  heartbeatInterval: number
  reconnectInterval: number
  maxReconnectTimes: number
  reconnectBackoff: number
}

// 默认配置
const defaultConfig: WsConfig = {
  url: '',
  heartbeatInterval: 25000,
  reconnectInterval: 5000,
  maxReconnectTimes: 10,
  reconnectBackoff: 1.5,
}

// 连接状态枚举
export enum WsStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
}

// 事件回调类型
type WsEventCallback = (data: any) => void

export class WebSocketClient {
  private ws: WebSocket | null = null
  private config: WsConfig
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectCount = 0
  private isManualClose = false
  private status: WsStatus = WsStatus.DISCONNECTED
  private token: string | null = null
  private visiblityHandler: (() => void) | null = null
  private onStatusChange?: (status: WsStatus) => void

  // 事件订阅：action -> callback[]
  private listeners: Map<string, WsEventCallback[]> = new Map()

  constructor(
    config: Partial<WsConfig>,
    token: string,
    onStatusChange?: (status: WsStatus) => void,
  ) {
    this.config = { ...defaultConfig, ...config }
    this.token = token
    this.onStatusChange = onStatusChange
  }

  /**
   * 获取当前连接状态
   */
  public getStatus(): WsStatus {
    return this.status
  }

  /**
   * 订阅指定 action 的消息
   */
  public on(action: string, callback: WsEventCallback) {
    const existing = this.listeners.get(action) || []
    existing.push(callback)
    this.listeners.set(action, existing)
  }

  /**
   * 取消订阅
   */
  public off(action: string, callback?: WsEventCallback) {
    if (!callback) {
      this.listeners.delete(action)
      return
    }
    const existing = this.listeners.get(action)
    if (existing) {
      const filtered = existing.filter((cb) => cb !== callback)
      if (filtered.length > 0) {
        this.listeners.set(action, filtered)
      } else {
        this.listeners.delete(action)
      }
    }
  }

  /**
   * 初始化连接
   */
  public initConnect(token?: string) {
    if (token) this.token = token
    if (!this.token) {
      console.error('[WebSocket] 认证token不能为空')
      return
    }

    const fullUrl = `${this.config.url}?token=${encodeURIComponent(this.token!)}`
    this.setStatus(WsStatus.CONNECTING)

    try {
      this.clearAllTimers()
      this.ws = new WebSocket(fullUrl)

      this.ws.onopen = () => {
        console.log('[WebSocket] 连接成功')
        this.reconnectCount = 0
        this.setStatus(WsStatus.CONNECTED)
        this.startHeartbeat()
        this.startVisibilityListener()
      }

      this.ws.onmessage = (event) => {
        const raw = event.data as string

        // 心跳响应
        if (raw === 'PONG') return

        // 后端主动心跳
        if (raw === 'PING') {
          this.ws?.send('PONG')
          return
        }

        // 解析消息
        try {
          const message = JSON.parse(raw) as WsPushMessage
          this.dispatchMessage(message)
        } catch (error) {
          console.error('[WebSocket] 消息解析失败：', error, '原始数据：', raw)
        }
      }

      this.ws.onclose = (event) => {
        console.warn(`[WebSocket] 连接关闭：${event.code}`)
        this.clearAllTimers()
        this.setStatus(WsStatus.DISCONNECTED)

        if (
          this.isManualClose ||
          event.code === WsCloseCode.NORMAL_CLOSURE ||
          event.code === WsCloseCode.POLICY_VIOLATION ||
          event.code === WsCloseCode.INVALID_TOKEN
        ) {
          return
        }

        if (!this.isManualClose && this.reconnectCount < this.config.maxReconnectTimes) {
          this.reconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error(`[WebSocket] 连接异常:`, error)
        this.setStatus(WsStatus.DISCONNECTED)
      }
    } catch (error) {
      console.error(`[WebSocket] 初始化失败：`, error)
      this.setStatus(WsStatus.DISCONNECTED)
      this.reconnect()
    }
  }

  /**
   * 分发消息到订阅者
   */
  private dispatchMessage(message: WsPushMessage) {
    const { action, data } = message
    if (!action) {
      console.warn('[WebSocket] 收到无 action 的消息：', message)
      return
    }

    const callbacks = this.listeners.get(action)
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach((cb) => cb(data))
    }

    // 同时触发通配符 '*' 监听（用于全局监控/日志）
    const wildcardCallbacks = this.listeners.get('*')
    if (wildcardCallbacks && wildcardCallbacks.length > 0) {
      wildcardCallbacks.forEach((cb) => cb(message))
    }
  }

  /**
   * 启动心跳定时器
   */
  private startHeartbeat() {
    this.clearHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('PING')
      }
    }, this.config.heartbeatInterval)
  }

  /**
   * 启动页面可见性监听
   */
  private startVisibilityListener() {
    this.stopVisibilityListener()

    this.visiblityHandler = () => {
      if (!document.hidden) {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('PING')
          this.startHeartbeat()
        } else if (
          !this.isManualClose &&
          (this.status === WsStatus.DISCONNECTED || this.status === WsStatus.RECONNECTING)
        ) {
          this.reconnectCount = 0
          this.initConnect()
        }
      }
    }

    document.addEventListener('visibilitychange', this.visiblityHandler)
  }

  /**
   * 停止页面可见性监听
   */
  private stopVisibilityListener() {
    if (this.visiblityHandler) {
      document.removeEventListener('visibilitychange', this.visiblityHandler)
      this.visiblityHandler = null
    }
  }

  /**
   * 自动重连（指数退避）
   */
  private reconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectCount++
    this.setStatus(WsStatus.RECONNECTING)

    const backoffInterval =
      this.config.reconnectInterval *
      Math.pow(this.config.reconnectBackoff, this.reconnectCount - 1)
    console.warn(
      `[WebSocket] 重连中（${this.reconnectCount}/${this.config.maxReconnectTimes}），间隔${Math.round(backoffInterval)}ms`,
    )

    this.reconnectTimer = setTimeout(() => {
      this.initConnect()
    }, backoffInterval)
  }

  /**
   * 发送业务消息
   */
  public sendMessage(data: NettyMessageDTO): boolean {
    if (this.status !== WsStatus.CONNECTED || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false
    }
    try {
      this.ws.send(JSON.stringify(data))
      return true
    } catch (error) {
      console.error('[WebSocket] 消息发送失败', error)
      return false
    }
  }

  /**
   * 手动关闭连接（关闭后不自动重连）
   */
  public close() {
    this.isManualClose = true
    this.clearAllTimers()
    this.stopVisibilityListener()
    if (this.ws) {
      this.ws.close(WsCloseCode.NORMAL_CLOSURE, '手动关闭连接')
      this.ws = null
    }
    this.listeners.clear()
    this.setStatus(WsStatus.DISCONNECTED)
  }

  /**
   * 清除所有定时器
   */
  public clearAllTimers() {
    this.clearHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private setStatus(status: WsStatus) {
    this.status = status
    this.onStatusChange?.(status)
  }
}

// 单例管理
let wsClient: WebSocketClient | null = null

const BASE_WS_URL = import.meta.env.VITE_WS_URL + import.meta.env.VITE_WS_PATH

export const initWebSocketInstance = (
  token: string,
  onStatusChange?: (status: WsStatus) => void,
) => {
  if (wsClient) {
    wsClient.close()
  }
  wsClient = new WebSocketClient(
    {
      url: BASE_WS_URL,
      heartbeatInterval: 25000,
      reconnectInterval: 5000,
      maxReconnectTimes: 10,
      reconnectBackoff: 1.5,
    },
    token,
    onStatusChange,
  )
  return wsClient
}

export const resetWebSocketInstance = () => {
  if (wsClient) {
    wsClient.close()
    wsClient = null
  }
}

export const getWebSocket = () => wsClient
