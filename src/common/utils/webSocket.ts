// 后端 WsPushMessage 统一信封格式
export interface WsPushMessage {
  action: string
  /** 发送者。仅客户端转发的消息有值，服务端事件推送为 null */
  from?: { userId: number; username: string } | null
  data: any
}

// 后端 NettyMessageDTO 对应 TS 类型（客户端上行报文）
// 只有「发给谁 + 发什么」两个字段：协议层面没有广播表达方式，越权入口不存在
export interface NettyMessageDTO {
  userId: number
  data: unknown
}

// 通知推送 DTO（action=NEW_NOTICE/REVOKE_NOTICE 时的 data）
// bizType / bizKey / processInstanceId / taskId 为可选字段，后端未下发时前端自动降级
export interface NoticeWebSocketDTO {
  action: string
  noticeId: number
  title?: string
  type?: string // '1'-通知 '2'-消息 '3'-待办（后端 char，与 Notify 的 switch 分支一致）
  content?: string
  senderName?: string
  sendTime?: string
  // 业务关联信息，用于“查看详情 / 快速通过”直达
  bizType?: string
  bizKey?: string
  processInstanceId?: string
  taskId?: string
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
type WsEventCallback = (data: any, message?: WsPushMessage) => void

export class WebSocketClient {
  private ws: WebSocket | null = null
  private config: WsConfig
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectCount = 0
  private isManualClose = false
  private status: WsStatus = WsStatus.DISCONNECTED
  private token: string | null = null
  private visibilityHandler: (() => void) | null = null
  private onStatusChange?: (status: WsStatus) => void
  /** 服务端明确拒绝（正常关闭/策略拒绝/token 失效）：此后不再自动重连 */
  private terminalClosed = false

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
      // 先解绑并关闭上一个 socket：它的回调仍闭包在 this 上，若保留，
      // 迟到的 close/error 会清掉新 socket 的定时器、改掉连接状态并再排一次重连。
      this.detachSocket()
      this.clearAllTimers()
      this.terminalClosed = false

      const socket = new WebSocket(fullUrl)
      this.ws = socket

      socket.onopen = () => {
        // 已被替换的 socket 迟到事件一律忽略
        if (this.ws !== socket) return
        this.reconnectCount = 0
        this.setStatus(WsStatus.CONNECTED)
        this.startHeartbeat()
        this.startVisibilityListener()
      }

      socket.onmessage = (event) => {
        if (this.ws !== socket) return
        const raw = event.data as string

        // 心跳响应
        if (raw === 'PONG') return

        // 后端主动心跳
        if (raw === 'PING') {
          socket.send('PONG')
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

      socket.onclose = (event) => {
        // 已被替换的旧 socket：它的关闭与当前连接无关
        if (this.ws !== socket) return
        // 手动关闭时 close() 已经上报过 DISCONNECTED；浏览器可能在新连接建立后
        // 才派发这个事件，此处若再写状态就会把新连接覆盖成断开。
        if (this.isManualClose) return
        console.warn(`[WebSocket] 连接关闭：${event.code}`)
        this.clearAllTimers()
        this.setStatus(WsStatus.DISCONNECTED)

        if (
          this.isManualClose ||
          event.code === WsCloseCode.NORMAL_CLOSURE ||
          event.code === WsCloseCode.POLICY_VIOLATION ||
          event.code === WsCloseCode.INVALID_TOKEN
        ) {
          // 这些关闭是「别再连了」：记下来，避免页面重新可见时又被可见性监听拉起
          this.terminalClosed = true
          return
        }

        if (!this.isManualClose && this.reconnectCount < this.config.maxReconnectTimes) {
          this.reconnect()
        }
      }

      socket.onerror = (error) => {
        if (this.ws !== socket) return
        if (this.isManualClose) return
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
      // 第二个参数传完整信封：发送者身份由服务端注入在 from 上，业务侧不应从 data 里读
      callbacks.forEach((cb) => cb(data, message))
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

    this.visibilityHandler = () => {
      if (!document.hidden) {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('PING')
          this.startHeartbeat()
        } else if (
          !this.isManualClose &&
          !this.terminalClosed &&
          (this.status === WsStatus.DISCONNECTED || this.status === WsStatus.RECONNECTING)
        ) {
          this.reconnectCount = 0
          this.initConnect()
        }
      }
    }

    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  /**
   * 停止页面可见性监听
   */
  private stopVisibilityListener() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
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
    this.detachSocket(WsCloseCode.NORMAL_CLOSURE, '手动关闭连接')
    this.listeners.clear()
    this.setStatus(WsStatus.DISCONNECTED)
    // 解绑状态回调：close 之后这个实例仍然可能收到浏览器的迟到事件，
    // 保留回调就会继续写外部的共享状态（如把新连接标成断开）。
    this.onStatusChange = undefined
  }

  /**
   * 解绑并关闭当前 socket。
   *
   * 浏览器对已关闭连接的 close/error 事件是异步派发的，保留回调就会在「已经换过连接」
   * 之后继续执行，清掉新连接的定时器、改掉状态、再排一次重连。
   */
  private detachSocket(code?: number, reason?: string) {
    const socket = this.ws
    if (!socket) return
    socket.onopen = null
    socket.onmessage = null
    socket.onclose = null
    socket.onerror = null
    try {
      socket.close(code, reason)
    } catch {
      // 已经处于关闭状态，忽略
    }
    this.ws = null
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
