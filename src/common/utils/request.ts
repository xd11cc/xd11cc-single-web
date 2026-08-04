import axios from 'axios'
import type { ResponseVO } from 'types/api'
import { getToken, removeToken } from '@@/utils/cache/cookies'
import { resetRouter, router } from '@/router'
import { useUserStore } from '@/pinia/stores/user'
import { i18n } from '@/i18n'

// 创建axios实例
const BASE_URL = import.meta.env.VITE_BASE_URL + import.meta.env.VITE_PUBLIC_PATH
const service = axios.create({
  baseURL: BASE_URL,
  timeout: 3000,
})

// 防止 token 过期时多个并发请求同时触发 401 导致重复跳转
let isHandlingUnauthorized = false

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      isHandlingUnauthorized = false
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },

  (error) => {
    console.error('请求拦截器错误', error)
    return Promise.reject(error)
  },
)

function handleUnauthorized() {
  if (isHandlingUnauthorized) return
  isHandlingUnauthorized = true
  ElMessage.warning(i18n.global.t('common.network.unauthorized'))
  removeToken()
  resetRouter()
  const userStore = useUserStore()
  userStore.resetToken()
  const fullPath = router.currentRoute.value.fullPath
  if (fullPath !== '/login') {
    router.push(`/login?redirect=${encodeURIComponent(fullPath)}`)
  }
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
          handleUnauthorized()
          return Promise.reject(new Error(errorMsg))
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
        handleUnauthorized()
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
      ElMessage.error(getLocalizedErrorMessage(status))
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
