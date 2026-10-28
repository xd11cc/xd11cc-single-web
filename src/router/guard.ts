import { useTitle } from '@@/composables/useTitle'
import type { Router } from 'vue-router'
import { useUserStore } from '@/pinia/stores/user'
import { usePermissionStore } from '@/pinia/stores/permission'
import { isWhiteList } from '@/router/whitelist'
import NProgress from 'nprogress'
import { setRouteChange } from '@@/composables/useRouteListener'
import { routerConfig } from './config'
import { i18n } from '@/i18n'

NProgress.configure({ showSpinner: false })

const { setTitle } = useTitle()

const LOGIN_PATH = '/login'
const CHUNK_RELOAD_KEY = 'router-chunk-reload-target'

// 多次导航同时发生时复用同一个初始化任务，避免重复请求、重复注册路由，
// 以及后发导航在路由尚未注册时被错误放行。
let permissionInitialization: Promise<void> | null = null

function isChunkLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk .* failed|ChunkLoadError|Unable to preload CSS/i.test(
    message,
  )
}

/**
 * 记录上次为哪个目标做过 chunk 恢复，以及发生时间。
 * 只记录目标（不记时间）会让「同一路径第二次失败」被永久跳过，
 * 用户就只能看到空白页并手动刷新——这正是之前的现象。
 */
interface ChunkReloadRecord {
  target: string
  at: number
}

function getChunkReloadRecord(): ChunkReloadRecord | null {
  try {
    const raw = sessionStorage.getItem(CHUNK_RELOAD_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ChunkReloadRecord
    return typeof parsed?.target === 'string' && typeof parsed?.at === 'number' ? parsed : null
  } catch {
    return null
  }
}

function setChunkReloadRecord(target: string) {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify({ target, at: Date.now() }))
  } catch {
    // sessionStorage 不可用时仍保留原始错误日志，避免刷新循环
  }
}

function clearChunkReloadTarget() {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  } catch {
    // sessionStorage 不可用无需额外处理
  }
}

export function registerNavigationGuard(router: Router) {
  // 全局前置守卫
  router.beforeEach(async (to, _from) => {
    NProgress.start()
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    // 如果没有登录
    if (!userStore.token) {
      // 如果 URL 中携带 token（如社交登录回调），先存入 store
      const urlToken = to.query.token as string
      if (urlToken) {
        userStore.setToken(urlToken)
        // 去掉 URL 中的 token 参数后继续导航
        const { token, ...restQuery } = to.query
        return { path: to.path, query: restQuery, replace: true }
      }
      // 如果在免登录的白名单中，则直接进入
      if (isWhiteList(to)) return true
      // 其他没有访问权限的页面将被重定向到登录页面
      return `${LOGIN_PATH}?redirect=${encodeURIComponent(to.fullPath)}`
    }
    // 如果已经登录，并准备进入 Login 页面，则重定向到主页
    if (to.path === LOGIN_PATH) return '/dashboard'
    // 用户信息和动态路由必须作为一个完整初始化过程。首次打开页面时，
    // 即使连续触发多次导航，也只会执行一次并等待路由真正注册完成。
    if (permissionStore.routesReady) return true
    try {
      if (!permissionInitialization) {
        permissionInitialization = (async () => {
          if (userStore.roles.length === 0) {
            await userStore.getInfo()
          }
          // 注意：角色必须是一个数组！例如：["admin"] 或 ["developer", "editor"]
          const roles = userStore.roles
          // 生成可访问的 Routes
          routerConfig.dynamic
            ? await permissionStore.generateRoutes(roles)
            : permissionStore.setAllRoutes()
          // 将“有访问权限的动态路由”添加到 Router 中
          permissionStore.addRoutes.forEach((route) => router.addRoute(route))
          permissionStore.markRoutesReady()
        })().finally(() => {
          permissionInitialization = null
        })
      }
      await permissionInitialization
      // 设置 replace: true，因此导航将不会留下历史记录
      return { ...to, replace: true }
    } catch (error) {
      // 过程中发生错误，直接重置 Token，并重定向到登录页面
      userStore.resetToken()
      console.error('Failed to load user permissions', error)
      ElMessage.error(i18n.global.t('common.messages.routeGuardError'))
      return LOGIN_PATH
    }
  })

  router.afterEach((to, _from, failure) => {
    if (!failure) {
      clearChunkReloadTarget()
      setRouteChange(to)
      setTitle(to.meta.title)
    }
    NProgress.done()
  })

  // 发布新版本或网络波动可能导致懒加载 chunk 获取失败。首次失败时直接
  // 打开目标地址以获取最新入口和资源；同一目标只恢复一次，防止刷新循环。
  router.onError((error, to) => {
    NProgress.done()
    console.error('Router navigation failed', error)
    if (!isChunkLoadError(error)) return

    const target = to.fullPath
    const record = getChunkReloadRecord()
    // 同一目标 10 秒内只自动恢复一次，既避免刷新死循环，
    // 又不会因为一次历史失败导致之后再也无法自愈
    if (record?.target === target && Date.now() - record.at < 10_000) return

    setChunkReloadRecord(target)
    const href = router.resolve(target).href
    // 开发期 Vite 正在重新预构建依赖时，旧 dep URL 会短暂 504。
    // 立刻刷新会再次命中，稍等让预构建完成再跳转。
    const delay = import.meta.env.DEV ? 800 : 0
    if (delay) {
      window.setTimeout(() => window.location.assign(href), delay)
    } else {
      window.location.assign(href)
    }
  })
}
