import axios from 'axios'
import type { ResponseVO } from 'types/api'
import { getToken, removeToken } from '@@/utils/cache/cookies'
import { resetRouter, router } from '@/router'
import { useUserStore } from '@/pinia/stores/user'

// 创建axios实例
const BASE_URL = import.meta.env.VITE_BASE_URL + import.meta.env.VITE_PUBLIC_PATH
const service = axios.create({
  baseURL: BASE_URL,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
  },
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
  ElMessage.warning('登录已过期，请重新登录')
  removeToken()
  resetRouter()
  const userStore = useUserStore()
  userStore.resetToken()
  const fullPath = router.currentRoute.value.fullPath
  if (fullPath !== '/login') {
    router.push(`/login?redirect=${encodeURIComponent(fullPath)}`)
  }
}

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code && res.code !== 200) {
      console.warn('业务错误', res.msg)
      switch (res.code) {
        case 400:
          console.error('请求参数错误')
          break
        case 401:
          console.error('未授权或者token过期')
          handleUnauthorized()
          return Promise.reject(new Error(res.msg))
        case 403:
          console.error('未授权')
          ElMessage.error('未授权')
          break
        case 404:
          console.error('接口不存在')
          ElMessage.error('接口不存在')
          break
        case 500:
          console.error('服务器内部异常')
          break
      }
      ElMessage.error(res.msg)
      return Promise.reject(new Error(res.msg))
    }
    return res
  },
  (error) => {
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      ElMessage.error({
        message: '请求超时啦～ 请检查网络或稍后重试',
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
        ElMessage.error('接口不存在')
        break
      case 500:
        console.error('服务器内部异常', error)
        break
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
