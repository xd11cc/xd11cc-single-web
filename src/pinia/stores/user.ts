import { loginByPassword, getUserInfo, logout as _logout } from '@/views/login/apis/index'
import { getToken, setToken as _setToken, removeToken } from '@@/utils/cache/cookies'
import type { LoginForm } from '@/views/login/apis/type'
import { routerConfig } from '@/router/config'
import { resetRouter } from '@/router'
import { useSettingsStore } from './settings'
import { useTagsViewStore } from './tags-view'
import type { RouteRecordRaw } from 'vue-router'
import { usePermissionStore } from './permission'
import { resetUnauthorizedHandling } from '@/common/utils/request'
import { resetPermissionInitialization } from '@/router/permission-init'

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
    resetUnauthorizedHandling()
  }

  // 获取用户详情
  const getInfo = async () => {
    // 记录发起时的登录态：若请求期间用户登出/换号，迟到的响应会把上一个人的
    // 用户 ID、角色和权限写进新会话（token 已经是新人的了）
    const tokenAtRequest = token.value
    const { data } = await getUserInfo()
    if (token.value !== tokenAtRequest) return
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
    // 记下发起登出时的登录态：请求期间用户可能已经换号登录，
    // 旧登出的回调不能把新会话清掉
    const tokenAtLogout = token.value
    await _logout()
    if (token.value !== tokenAtLogout) return
    resetToken()
  }

  // 重置 Token 及其关联的用户、权限、动态路由和页面缓存状态。
  // Token 失效后必须完整清理，否则重新登录时会误判动态路由仍然可用。
  const resetToken = () => {
    removeToken()
    token.value = ''
    roles.value = []
    permissions.value = []
    routes.value = []
    userId.value = 0
    username.value = ''
    nickname.value = ''
    sex.value = ''
    phone.value = ''
    email.value = ''
    headUrl.value = ''
    deptId.value = 0
    deptName.value = ''
    postId.value = 0
    postName.value = ''
    roleNames.value = []
    resetRouter()
    // 清掉权限初始化的单飞 Promise：否则换号登录时新导航会 await 上一个会话的初始化
    resetPermissionInitialization()
    const permissionStore = usePermissionStore()
    permissionStore.reset()
    resetTagsView(true)
  }

  // 重置 Visited Views 和 Cache Views
  const resetTagsView = (force = false) => {
    const settingsStore = useSettingsStore()
    if (force || !settingsStore.cacheTagsView) {
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
