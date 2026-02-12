import axios from 'axios'
import { getToken, removeToken } from '@@/utils/cache/cookies'
import { resetRouter } from '@/router'

// 创建axios实例
const BASE_URL = import.meta.env.VITE_BASE_URL + import.meta.env.VITE_PUBLIC_PATH
const service = axios.create({
  baseURL: BASE_URL,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },

  (error) => {
    console.error('请求拦截器错误', error)
    return Promise.reject(error)
  },
)

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
          // 清除本地存储的token
          removeToken()
          // 强制刷新页面，触发导航守卫
          window.location.reload()
          break
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
      // 方式2：UI 库提示（推荐，更美观，以 Element Plus 为例）
      ElMessage.error({
        message: '请求超时啦～ 请检查网络或稍后重试',
        duration: 3000, // 提示显示3秒后自动关闭
      })
    }
    const status = error.response?.status
    switch (status) {
      case 400:
        console.error('请求参数错误', error)
        break
      case 401:
        console.error('未授权或者token过期')
        // 清除本地存储的token
        removeToken()
        // 强制刷新页面，触发导航守卫
        window.location.reload()
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
    return Promise.reject(error)
  },
)

export default service
