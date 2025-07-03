import axios from 'axios'

// 创建axios实例
const BASE_URL = import.meta.env.VITE_BASE_API
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
    const token = localStorage.getItem('token')
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
      console.warn('业务错误', res.message)
      return Promise.reject(new Error(res.message))
    }
    return res.data
  },
  (error) => {
    const status = error.response?.status
    switch (status) {
      case 400:
        console.error('请求参数错误', error)
        break
      case 401:
        console.error('未授权或者token过期')
        break
      case 403:
        console.error('没有授权')
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
