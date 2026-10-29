import type { RouteRecordRaw, RouteComponent } from 'vue-router'
import { defineComponent, h } from 'vue'
import type { ResponseVO } from 'types/api'
import { publicRoutes } from '@/router/index'
import { resolveDirRedirect } from '@/router/route-redirect'
import { pinia } from '@/pinia'
import { getRoutes } from '@/views/login/apis'
import type { RouteVO } from '@/views/login/apis/type'

const Layouts = () => import('@/layouts/index.vue')

/**
 * 菜单里配置的组件找不到时渲染的页面。
 * 这里把「配置的组件路径」显示出来：否则菜单写错一个字母，
 * 用户只看到 404，排查时只能靠猜是哪个菜单的问题。
 */
const MissingView = (componentPath: string) =>
  defineComponent({
    name: 'MissingView',
    setup: () => () =>
      h('div', { style: 'padding: 48px; text-align: center' }, [
        h('h2', { style: 'margin-bottom: 12px; font-size: 18px' }, '页面组件不存在'),
        h('p', { style: 'margin-bottom: 8px; color: #666' }, componentPath),
        h(
          'p',
          { style: 'font-size: 13px; color: #999' },
          '请到「系统管理 → 菜单管理」核对该菜单的组件路径是否正确。',
        ),
      ]),
  })

const viewModules = import.meta.glob('@/views/**/*.vue', { eager: false })

/**
 * 把「菜单里配置的组件字符串」解析成路由组件。
 *
 * 支持两种约定：`system/user`（目录 + index.vue）与 `system/dict/data`（直接指向文件）。
 * 解析失败时不静默回落 404，而是打印完整上下文并渲染 MissingView，
 * 让「菜单配置错误」在控制台和页面上都能被指出。
 */
const loadView = (view: string): RouteComponent => {
  const fullPath = `/src/views/${view}.vue`
  const indexPath = `/src/views/${view}/index.vue`

  const importFn = viewModules[fullPath] || viewModules[indexPath]
  if (importFn) return importFn

  console.error(
    `[router] 菜单配置的组件不存在：${view}\n  已尝试：${fullPath} / ${indexPath}\n  请检查 system_menu.component 字段`,
  )
  return MissingView(view)
}

const transformBackendRoutes = (backendRoutes: RouteVO[]): RouteRecordRaw[] => {
  return backendRoutes.map((route) => {
    const isDirectory = route.component === 'Layout' || !route.component
    const children =
      route.children && route.children.length > 0 ? transformBackendRoutes(route.children) : []

    const baseRoute: Omit<RouteRecordRaw, 'component'> & { component?: RouteComponent } = {
      path: route.path,
      name: route.name,
      meta: {
        ...(route.meta || {}),
        // 有页面的路由默认缓存（标签栏切回时保留状态）；目录不缓存。
        // 后端将来若下发 meta.keepAlive，以此处为准会被覆盖。
        keepAlive: isDirectory ? false : (route.meta?.keepAlive ?? true),
      },
    }

    if (isDirectory) {
      baseRoute.component = Layouts
      // 哨兵值换真实目标；找不到可见子页时干脆不设 redirect
      const target =
        route.redirect === 'noRedirect'
          ? resolveDirRedirect(String(route.path), children, (c) => c === Layouts)
          : route.redirect
      if (target) baseRoute.redirect = target
    } else {
      baseRoute.component = loadView(route.component as string)
      if (route.redirect) baseRoute.redirect = route.redirect
    }

    if (children.length > 0) baseRoute.children = children

    return baseRoute as RouteRecordRaw
  })
}

export const usePermissionStore = defineStore('permission', () => {
  /** 动态路由是否已完成注册（不能用「角色是否为空」代替：用户信息和路由是两个独立请求） */
  const routesReady = ref(false)

  /** 侧边栏 / 面包屑 / 标签页使用的路由全集（公共路由 + 后端返回） */
  const routes = ref<RouteRecordRaw[]>([])

  /** 需要 addRoute 的后端路由 */
  const addRoutes = ref<RouteRecordRaw[]>([])

  /**
   * 拉取并转换后端路由。
   *
   * fetchRoutes 作为参数注入：生产用真实的 getRoutes，测试可以传一个假实现，
   * 从而不必 mock HTTP 就能验证「转换 + 注册」这段逻辑。
   */
  const generateRoutes = async (
    fetchRoutes: () => Promise<ResponseVO<RouteVO[]>> = getRoutes,
  ): Promise<RouteRecordRaw[]> => {
    const { data } = await fetchRoutes()
    const accessedRoutes = transformBackendRoutes(data ?? [])
    routes.value = publicRoutes.concat(accessedRoutes)
    addRoutes.value = accessedRoutes
    return accessedRoutes
  }

  const markRoutesReady = () => {
    routesReady.value = true
  }

  const reset = () => {
    routesReady.value = false
    routes.value = publicRoutes
    addRoutes.value = []
  }

  return { routesReady, routes, addRoutes, generateRoutes, markRoutesReady, reset }
})

export function usePermissionStoreOutside() {
  return usePermissionStore(pinia)
}
