import { loginByPassword, getUserInfo, logout as _logout } from '@/views/login/apis/index.js'
import { getToken, setToken as _setToken, removeToken } from '@@/utils/cache/cookies'
import type { LoginForm } from '@/views/login/apis/type'
import { routerConfig } from '@/router/config'
import { resetRouter } from '@/router'
import { useSettingsStore } from './settings'
import { useTagsViewStore } from './tags-view'
import { pinia } from '..'
import { RouteRecordRaw } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken() || '')

  const roles = ref<string[]>([])

  const permissions = ref<string[]>([])

  const routes = ref<RouteRecordRaw[]>([])

  const username = ref<string>('')

  const tagsViewStore = useTagsViewStore()

  const settingsStore = useSettingsStore()

  // 设置 Token
  const setToken = (value: string) => {
    _setToken(value)
    token.value = value
  }

  // 登录
  const userLogin = async (loginForm: LoginForm) => {
    const { data } = await loginByPassword(loginForm)
    setToken(data)
  }

  // 获取用户详情
  const getInfo = async () => {
    const { data } = await getUserInfo()
    username.value = data.username
    permissions.value = data.permissions
    // 验证返回的 roles 是否为一个非空数组，否则塞入一个没有任何作用的默认角色
    roles.value = data.roles?.length > 0 ? data.roles : routerConfig.defaultRoles
  }

  // 登出
  const logout = async () => {
    await _logout()
    removeToken()
    token.value = ''
    roles.value = []
    permissions.value = []
    resetRouter()
    resetTagsView()
  }

  // 重置 Token
  const resetToken = () => {
    removeToken()
    token.value = ''
    roles.value = []
  }

  // 重置 Visited Views 和 Cache Views
  const resetTagsView = () => {
    if (!settingsStore.cacheTagsView) {
      tagsViewStore.delAllVisitedViews()
      tagsViewStore.delAllCachedViews()
    }
  }

  return { token, roles, routes, username, setToken, userLogin, getInfo, logout, resetToken }
})

export function useUserStoreOutside() {
  return useUserStore(pinia)
}
