import type { RouteRecordRaw, RouteComponent } from 'vue-router'
import { publicRoutes } from '@/router/index'
import { flatMultiLevelRoutes } from '@/router/helper'
import { pinia } from '@/pinia'
import { routerConfig } from '@/router/config'
import { getRoutes } from '@/views/login/apis'
import type { RouteVO } from '@/views/login/apis/type'

const Layouts = () => import('@/layouts/index.vue')
const Error404 = () => import('@/views/error/404.vue')
/**
 * 权限判断：校验用户角色/权限是否拥有路由访问权限
 * @param roles
 * @param route
 * @returns
 */
function hasPermission(roles: string[], route: RouteRecordRaw) {
  const routeRoles = route.meta?.roles
  return routeRoles ? roles.some((role) => routeRoles.includes(role)) : true
}

/**
 * 过滤可访问的动态路由
 * @param routes
 * @param roles
 * @returns
 */
function filterDynamicRoutes(routes: RouteRecordRaw[], roles: string[]) {
  const res: RouteRecordRaw[] = []
  routes.forEach((route) => {
    const tempRoute = { ...route }
    if (hasPermission(roles, tempRoute)) {
      if (tempRoute.children) {
        tempRoute.children = filterDynamicRoutes(tempRoute.children, roles)
      }
      res.push(tempRoute)
    }
  })
  return res
}

/**
 * 处理后端路由
 * @param backendRoutes
 * @returns
 */
const transformBackendRoutes = (backendRoutes: RouteVO[]): RouteRecordRaw[] => {
  return backendRoutes.map((route) => {
    const baseRoute: Omit<RouteRecordRaw, 'component'> & { component?: RouteComponent } = {
      path: route.path,
      name: route.name,
      redirect: route.redirect,
      meta: route.meta || {},
    }

    if (route.component) {
      if (route.component === 'Layout' || !route.component) {
        baseRoute.component = Layouts
      } else {
        baseRoute.component = loadView(route.component)
      }
    }

    if (route.children && route.children.length > 0) {
      baseRoute.children = transformBackendRoutes(route.children)
    }

    return baseRoute as RouteRecordRaw
  })
}

// 在模块顶部定义视图模块的映射
const viewModules = import.meta.glob('@/views/**/*.vue', { eager: false })

const loadView = (view: string): RouteComponent => {
  const fullPath = `/src/views/${view}.vue`
  const indexPath = `/src/views/${view}/index.vue`

  const importFn = viewModules[fullPath] || viewModules[indexPath]
  if (importFn) {
    return importFn
  }

  return Error404
}

export const usePermissionStore = defineStore('permission', () => {
  // 动态路由是否已完成注册。不能用用户角色是否存在来代替该状态，
  // 因为角色信息和后端路由是两个独立的异步请求。
  const routesReady = ref(false)

  // 可访问的路由
  const routes = ref<RouteRecordRaw[]>([])

  // 有访问权限的动态路由
  const addRoutes = ref<RouteRecordRaw[]>([])

  // 后端返回的动态路由（内部状态）
  const dynamicRoutes = ref<RouteRecordRaw[]>([])

  // 生成可访问的 Routes
  const generateRoutes = async (roles: string[]) => {
    const { data } = await getRoutes()
    const backendRoutes = transformBackendRoutes(data)
    dynamicRoutes.value = []
    backendRoutes.forEach((route) => {
      dynamicRoutes.value.push(route)
    })
    const accessedRoutes = filterDynamicRoutes(dynamicRoutes.value, roles)
    set(accessedRoutes)
  }

  const setAllRoutes = () => {
    set(dynamicRoutes.value)
  }

  const markRoutesReady = () => {
    routesReady.value = true
  }

  // 统一设置
  const set = (accessedRoutes: RouteRecordRaw[]) => {
    routes.value = publicRoutes.concat(accessedRoutes)
    addRoutes.value = routerConfig.thirdLevelRouteCache
      ? flatMultiLevelRoutes(accessedRoutes)
      : accessedRoutes
  }

  const reset = () => {
    routesReady.value = false
    routes.value = publicRoutes
    addRoutes.value = []
    dynamicRoutes.value = []
  }

  return { routesReady, routes, addRoutes, generateRoutes, setAllRoutes, markRoutesReady, reset }
})

export function usePermissionStoreOutside() {
  return usePermissionStore(pinia)
}
