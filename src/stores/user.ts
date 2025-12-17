import { defineStore } from 'pinia'
import { loginByPassword } from '@/api/login/login.js'
import { setItem, getItem } from '@/utils/storage'
import router from '@/router'

interface LoginForm {
  username: string
  password: string
  way: number
  device: number
  app: number
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getItem('token'),
  }),
  getters: {},
  actions: {
    async userLogin(loginForm: LoginForm) {
      const res = await loginByPassword(loginForm)
      if (res.code == 200) {
        const token = res.data.accessToken
        this.token = token
        setItem('token', token)
        router.push('/index')
        return 'success'
      } else {
        return Promise.reject(new Error(res.msg))
      }
    },
  },
})
