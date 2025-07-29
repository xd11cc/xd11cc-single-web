import { defineStore } from 'pinia'
import { loginByPassword } from '@/api/login/login.js'
import { setItem, getItem } from '@/utils/storage'
import router from '@/router'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getItem('token'),
  }),
  getters: {},
  actions: {
    async userLogin(loginForm) {
      const res = await loginByPassword(loginForm)
      if (res.code == 200) {
        let token = res.data.accessToken
        this.token = token
        setItem('token', token)
        router.push('/index')
        return 'success'
      } else {
        return Promise.reject(new Error(res.data.msg))
      }
    },
  },
})
