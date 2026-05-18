// 后端 NettyMessageDTO 对应 TS 类型
export interface NettyMessageDTO {
  webSocketEnum: 'USER' | 'TENANT' | 'GLOBAL'
  userId?: number
  tenantId?: number
  content: string
}

// WebSocket 关闭码枚举
enum WsCloseCode {
  NORMAL_CLOSURE = 1000, //正常关闭
  POLICY_VIOLATION = 1008, // 策略违反，如token无效
  INVALID_TOKEN = 4001, // 自定义
  ABNORMAL_CLOSURE = 1006, // 异常关闭
}

// webSocket配置项接口
export interface WsConfig {
  url: string // WebSocket 连接地址，如：ws://localhost:8080/ws
  heartbeatInterval: number // 心跳间隔（毫秒），建议小于后端空闲时间
  reconnectInterval: number // 重连间隔（毫秒）
  maxReconnectTimes: number // 最大重连次数
  reconnectBackoff: number // 重连指数退避系数
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

export class WebSocketClient {
  private ws: WebSocket | null = null
  private config: WsConfig
  private heartbeatTimer: NodeJS.Timeout | null = null // 心跳定时器
  private reconnectTimer: NodeJS.Timeout | null = null // 重连定时器
  private reconnectCount = 0 // 当前重连次数
  private isManualClose = false // 是否手动关闭连接
  private messageCallback: ((data: NettyMessageDTO) => void) | null = null // 消息回调
  private status: WsStatus = WsStatus.DISCONNECTED // 连接状态
  private token: string | null = null // 存储token，重连时复用
  private visiblityHandler: (() => void) | null = null // 页面可见性监听
  private onStatusChange?: (status: WsStatus) => void // 状态变更回调

  constructor(config: Partial<WsConfig>, token: string, onStatusChange?: (status: WsStatus) => void) {
    // 合并配置
    this.config = { ...defaultConfig, ...config }
    this.token = token
    this.onStatusChange = onStatusChange
  }

  /**
   * 获取当前连接状态
   * @returns
   */
  public getStatus(): WsStatus {
    return this.status
  }

  /**
   * 初始化连接
   */
  public initConnect(token?: string) {
    if (token) this.token = token
    if (!this.token) {
      console.error(' [WebSocket] 认证token不能为空')
    }

    // 构建完整的URL
    const fullUrl = `${this.config.url}?token=${encodeURIComponent(this.token!)}`
    this.setStatus(WsStatus.CONNECTING)

    try {
      this.clearAllTimers() // 清除旧定时器
      this.ws = new WebSocket(fullUrl)

      // 连接成功回调
      this.ws.onopen = () => {
        console.log(' [WebSocket] 连接成功')
        this.reconnectCount = 0 // 重置重连次数
        this.setStatus(WsStatus.CONNECTED)
        this.startHeartbeat() // 启动心跳检测
        this.startVisibilityListener()
      }

      // 接收消息回调
      this.ws.onmessage = (event) => {
        if (event.data === 'PONG') {
          return
        }
        // 处理文本消息
        try {
          const data = JSON.parse(event.data) as NettyMessageDTO
          this.handleMessage(data)
        } catch (error) {
          // 后端PING字符串响应
          if (event.data === 'PING') {
            this.ws?.send('PONG')
            return
          }
          console.error(' [WebSocket] 消息解析失败：', error, '原始数据：', event.data)
        }
      }

      // 连接关闭回调
      this.ws.onclose = (event) => {
        console.warn(` [WebSocket] 连接关闭：${event.code}`)
        this.clearAllTimers()
        this.setStatus(WsStatus.DISCONNECTED)

        // 手动关闭/正常关闭/认证失败 -> 不重连
        if (
          this.isManualClose ||
          event.code === WsCloseCode.NORMAL_CLOSURE ||
          event.code === WsCloseCode.POLICY_VIOLATION ||
          event.code === WsCloseCode.INVALID_TOKEN ||
          event.reason.includes('token')
        ) {
          return
        }

        // 异常关闭 && 未到达最大重连次数 -> 自动重连
        if (!this.isManualClose && this.reconnectCount < this.config.maxReconnectTimes) {
          this.reconnect()
        }
      }

      // 连接错误回调
      this.ws.onerror = (error) => {
        console.error(` [WebSocket] 连接异常:${error}`)
        this.setStatus(WsStatus.DISCONNECTED)
      }
    } catch (error) {
      console.error(` [WebSocket] 初始化失败：${error}`)
      this.setStatus(WsStatus.DISCONNECTED)
      this.reconnect()
    }
  }

  /**
   * 处理接收的消息
   * @param data
   * @returns
   */
  private handleMessage(data: NettyMessageDTO) {
    // 触发自定义回调
    if (this.messageCallback) {
      this.messageCallback(data)
      return
    }

    // 业务消息
    ElMessageBox.alert(data.content, '新消息提醒', {
      confirmButtonText: '确认',
      type: 'info',
      dangerouslyUseHTMLString: true, // 支持富文本内容
    })
  }

  /**
   * 启动心跳定时器
   */
  private startHeartbeat() {
    this.clearHeartbeat() // 先清除旧的心跳定时器
    console.log('开启 [webSocket] 心跳')
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // 发送心跳包
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
      // 页面变为可见状态
      if (!document.hidden) {
        console.log('[WebSocket] 页面从后台恢复')
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('PING')
          this.startHeartbeat()
        } else if (
          !this.isManualClose &&
          (this.status === WsStatus.DISCONNECTED || this.status === WsStatus.RECONNECTING)
        ) {
          console.log('[WebSocket] 连接已断开，尝试立即重连')
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
   * 自动重连，指数避退重连（避免频繁重连）
   */
  private reconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectCount++
    this.setStatus(WsStatus.RECONNECTING)

    // 计算避退后的重连间隔
    const backoffInterval =
      this.config.reconnectInterval *
      Math.pow(this.config.reconnectBackoff, this.reconnectCount - 1)
    console.warn(
      ` [WebSocket] 重连中（${this.reconnectCount}/${this.config.maxReconnectTimes}）,间隔${Math.round(backoffInterval)}ms`,
    )

    this.reconnectTimer = setTimeout(() => {
      this.initConnect() // 重新初始化连接
    }, backoffInterval)
  }

  /**
   * 发送业务消息
   * @param data
   */
  public sendMessage(data: NettyMessageDTO) {
    if (this.status !== WsStatus.CONNECTED || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false
    }
    try {
      this.ws.send(JSON.stringify(data))
      console.debug(' [WebSocket] 发送业务消息：', data)
      return true
    } catch (error) {
      console.error(' [WebSocket] 消息发送失败', error)
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
      // 发送正常关闭帧
      this.ws.close(WsCloseCode.NORMAL_CLOSURE, '手动关闭连接')
      this.ws = null
    }
    this.setStatus(WsStatus.DISCONNECTED)
    console.info(' [WebSocket] 已手动关闭连接')
  }

  /**
   * 注册消息回调（供组件自定义处理消息）
   * @param callback
   */
  public onMessage(callback: (data: NettyMessageDTO) => void) {
    this.messageCallback = callback
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

  /**
   * 清除心跳定时器
   */
  private clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private setStatus(status: WsStatus) {
    this.status = status
    this.onStatusChange?.(status)
    console.debug(` [WebSocket] 状态变更：${status}`)
  }
}

// 导出单例（已废弃，请使用 useWebSocket composable）
let wsClient: WebSocketClient | null = null

const BASE_WS_URL = import.meta.env.VITE_WS_URL + import.meta.env.VITE_WS_PATH

/**
 * @deprecated 请使用 useWebSocket composable
 */
export const initWebSocketInstance = (token: string) => {
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
  )
  return wsClient
}

/**
 * @deprecated 请使用 useWebSocket composable
 */
export const resetWebSocketInstance = () => {
  if (wsClient) {
    wsClient.close()
    wsClient = null
    console.log(' [WebSocket]  实例已重置')
  }
}

/**
 * @deprecated 请使用 useWebSocket composable
 */
export const getWebSocket = () => wsClient
