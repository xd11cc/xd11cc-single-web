import axios from 'axios'
import type { ResponseVO } from 'types/api'
import { getToken } from '@@/utils/cache/cookies'
import { router } from '@/router'
import { useUserStore } from '@/pinia/stores/user'
import { i18n } from '@/i18n'
// 认证失效标记抽到独立模块：路由守卫要用它，而守卫直接引本文件会形成
// router → guard → request → router 的循环依赖。
import { markUnauthorizedHandled } from '@@/utils/unauthorized'

// 创建axios实例
// 默认 10s：3s 对跨公网 HTTPS + 慢 SQL 的后台接口过短，易误报超时。
// 上传/导出/Cron 试运行等长耗时接口在调用处用 LONG_REQUEST_TIMEOUT 单独覆盖。
// 接口基址：直连地址（可空）+ 后端 context-path。
// 不能复用 VITE_PUBLIC_PATH，那是前端的 base 路径。
const BASE_URL = import.meta.env.VITE_BASE_URL + import.meta.env.VITE_API_PREFIX
const DEFAULT_REQUEST_TIMEOUT = 10_000
export const LONG_REQUEST_TIMEOUT = 60_000

const service = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_REQUEST_TIMEOUT,
})

// 防止 token 过期时多个并发请求同时触发 401 导致重复跳转
let isHandlingUnauthorized = false
/** null 表示该请求明确未带 token；undefined 仅表示没有可用的请求快照。 */
const requestTokenSnapshots = new WeakMap<object, string | null>()

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    const authorization = config.headers['Authorization'] ?? config.headers['authorization']
    const tokenUsed =
      typeof authorization === 'string' ? authorization.replace(/^Bearer\s+/i, '') || null : null
    requestTokenSnapshots.set(config, tokenUsed)
    return config
  },

  (error) => {
    console.error('请求拦截器错误', error)
    return Promise.reject(error)
  },
)

/** 取回请求发起时的认证快照；未经过本实例拦截器的响应配置则回退读取 Authorization。 */
function tokenOfRequest(config?: object): string | null | undefined {
  if (!config) return undefined
  if (requestTokenSnapshots.has(config)) return requestTokenSnapshots.get(config)

  const headers = (config as { headers?: Record<string, unknown> }).headers
  const authorization = headers?.Authorization ?? headers?.authorization
  if (typeof authorization === 'string') {
    return authorization.replace(/^Bearer\s+/i, '') || null
  }
  return undefined
}

/**
 * 处理 401。
 *
 * `tokenUsed` 是这个请求发起时的认证快照：如果它（包括 null 的未登录态）
 * 已经不同于当前 token，说明期间用户已换会话，不能清掉新登录态。
 */
export function handleUnauthorized(tokenUsed?: string | null) {
  const currentToken = getToken() || null
  if (tokenUsed !== undefined && tokenUsed !== currentToken) return
  if (isHandlingUnauthorized) return
  isHandlingUnauthorized = true
  ElMessage.warning(i18n.global.t('common.network.unauthorized'))
  const fullPath = router.currentRoute.value.fullPath
  const userStore = useUserStore()
  userStore.resetToken()
  if (fullPath !== '/login') {
    router.replace({
      path: '/login',
      query: { redirect: fullPath },
    })
  }
}

// 仅在用户重新登录成功后解除 401 处理锁，避免并发请求重复跳转。
export function resetUnauthorizedHandling() {
  isHandlingUnauthorized = false
}

function getLocalizedErrorMessage(status?: number) {
  const keyMap: Record<number, string> = {
    400: 'common.network.badRequest',
    401: 'common.network.unauthorized',
    403: 'common.network.forbidden',
    404: 'common.network.notFound',
    500: 'common.network.serverError',
  }
  return i18n.global.t(keyMap[status || 0] || 'common.network.unknown')
}

/**
 * 错误提示文案：优先用后端 ResponseVO 的 msg。
 *
 * 后端在 400/403 等场景会给出具体原因（如「没有操作权限」），
 * 只用状态码映射会把它们压成一句泛化提示。
 */
function resolveErrorMessage(error: unknown, status?: number): string {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data
  if (
    data &&
    typeof data === 'object' &&
    !(data instanceof Blob) &&
    !(data instanceof ArrayBuffer)
  ) {
    const msg = (data as { msg?: unknown }).msg
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  return getLocalizedErrorMessage(status)
}

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code && res.code !== 200) {
      console.warn('业务错误', res.msg)
      // 默认使用后端返回的 msg，仅在 msg 为空时回退前端映射
      const errorMsg = res.msg || getLocalizedErrorMessage(res.code)
      switch (res.code) {
        case 400:
          console.error('请求参数错误')
          break
        case 401:
          console.error('未授权或者token过期')
          handleUnauthorized(tokenOfRequest(response.config))
          return Promise.reject(markUnauthorizedHandled(new Error(errorMsg)))
        case 403:
          console.error('未授权')
          break
        case 404:
          console.error('接口不存在')
          break
        case 500:
          console.error('服务器内部异常')
          break
      }
      if (res.code !== 401) {
        ElMessage.error(errorMsg)
      }
      return Promise.reject(new Error(errorMsg))
    }
    return res
  },
  (error) => {
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      ElMessage.error({
        message: i18n.global.t('common.network.timeout'),
        duration: 3000,
      })
    }
    const status = error.response?.status
    switch (status) {
      case 400:
        console.error('请求参数错误', error)
        break
      case 401:
        console.error('未授权或者token过期')
        // 打上标记，让路由守卫等调用方知道这次认证失效已经提示过、跳转过
        markUnauthorizedHandled(error)
        handleUnauthorized(tokenOfRequest(error.config))
        break
      case 403:
        console.error('未授权')
        break
      case 404:
        console.error('接口不存在')
        break
      case 500:
        console.error('服务器内部异常', error)
        break
    }
    if (status && status !== 401) {
      ElMessage.error(resolveErrorMessage(error, status))
    } else if (!status && error.code !== 'ECONNABORTED') {
      ElMessage.error(getLocalizedErrorMessage())
    }
    return Promise.reject(error)
  },
)

export function get<T>(url: string, params?: Record<string, unknown>): Promise<ResponseVO<T>> {
  return service({ url, method: 'GET', params })
}

export function post<T>(url: string, data?: unknown): Promise<ResponseVO<T>> {
  return service({ url, method: 'POST', data })
}

export default service
