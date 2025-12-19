import { defineStore } from 'pinia'
import { loginByPassword, getUserInfo, logout } from '@/api/login/login.js'
import { setItem, getItem, removeItem } from '@/utils/storage'
import router from '@/router'
import type { TreeMenuVO } from '@/types'

// 登录参数
interface LoginForm {
  username: string
  password: string
  way: number
  device: number
  app: number
}

const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getItem(TOKEN_KEY),
    userloginInfo: getItem(USER_INFO_KEY),
    treeMenu: null as TreeMenuVO[] | null,
    flatMenu: [] as TreeMenuVO[],
  }),
  getters: {},
  actions: {
    async userLogin(loginForm: LoginForm) {
      const res = await loginByPassword(loginForm)
      if (res.code == 200) {
        const token = res.data
        this.token = token
        setItem(TOKEN_KEY, token)
        router.push('/index')
        return 'success'
      } else {
        return Promise.reject(new Error(res.msg))
      }
    },
    async logout() {
      const res = await logout()
      if (res.code == 200) {
        this.token = ''
        this.userloginInfo = null
        removeItem(TOKEN_KEY)
        removeItem(USER_INFO_KEY)
        router.push('/login')
      }
    },
    async initMenu() {
      if (this.treeMenu) return
      const result = await getUserInfo()
      if (result.code === 200) {
        setItem(USER_INFO_KEY, result.data)
        this.userloginInfo = result.data
        this.treeMenu = result.data.treeMenuVOS
        this.flatMenu = flattenMenus(result.data.treeMenuVOS)
      }
    },
  },
})

// 菜单数组扁平化
export const flattenMenus = (menus: TreeMenuVO[]): TreeMenuVO[] => {
  const result: TreeMenuVO[] = []
  const stack = [...menus] // 用栈模拟递归
  while (stack.length) {
    const menu = stack.pop()!
    result.push({ ...menu, children: undefined })
    if (menu.children && menu.children.length) {
      stack.push(...menu.children) // 子菜单入栈
    }
  }
  return result
}
