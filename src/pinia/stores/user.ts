import { loginByPassword, getUserInfo, logout as _logout } from '@/views/login/apis/index'
import { getToken, setToken as _setToken, removeToken } from '@@/utils/cache/cookies'
import type { LoginForm } from '@/views/login/apis/type'
import { routerConfig } from '@/router/config'
import { resetRouter } from '@/router'
import { useSettingsStore } from './settings'
import { useTagsViewStore } from './tags-view'
import { pinia } from '..'
import type { RouteRecordRaw } from 'vue-router'
import { usePermissionStore } from './permission'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken() || '')

  const roles = ref<string[]>([])

  const permissions = ref<string[]>([])

  const routes = ref<RouteRecordRaw[]>([])

  const userId = ref<number>(0)
  const username = ref<string>('')
  const nickname = ref<string>('')
  const sex = ref<string>('')
  const phone = ref<string>('')
  const email = ref<string>('')
  const headUrl = ref<string>('')
  const deptId = ref<number>(0)
  const deptName = ref<string>('')
  const postId = ref<number>(0)
  const postName = ref<string>('')
  const roleNames = ref<string[]>([])

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
    userId.value = data.id
    username.value = data.username
    nickname.value = data.nickname || ''
    sex.value = data.sex || ''
    phone.value = data.phone || ''
    email.value = data.email || ''
    headUrl.value = data.headUrl || ''
    deptId.value = data.deptId || 0
    deptName.value = data.deptName || ''
    postId.value = data.postId || 0
    postName.value = data.postName || ''
    roleNames.value = data.roleNames || []
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
    const permissionStore = usePermissionStore()
    permissionStore.reset()
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
    const settingsStore = useSettingsStore()
    if (!settingsStore.cacheTagsView) {
      const tagsViewStore = useTagsViewStore()
      tagsViewStore.delAllVisitedViews()
      tagsViewStore.delAllCachedViews()
    }
  }

  return {
    token,
    roles,
    permissions,
    routes,
    userId,
    username,
    nickname,
    sex,
    phone,
    email,
    headUrl,
    deptId,
    deptName,
    postId,
    postName,
    roleNames,
    setToken,
    userLogin,
    getInfo,
    logout,
    resetToken,
  }
})

export function useUserStoreOutside() {
  return useUserStore(pinia)
}
