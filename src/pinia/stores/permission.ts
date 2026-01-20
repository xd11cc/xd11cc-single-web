import type { RouteRecordRaw } from 'vue-router'
import auth from '@@/utils/auth'
import { publicRoutes, dynamicRoutes } from '@/router/index'
import { flatMultiLevelRoutes } from '@/router/helper'
import { pinia } from '@/pinia'
import { routerConfig } from '@/router/config'

/**
 * 权限判断：校验用户角色/权限是否拥有路由访问权限
 * @param roles
 * @param route
 * @returns
 */
function hasPermission(roles: string[], route: RouteRecordRaw) {
  const routeRoles = route.meta?.roles
  const routePerms = route.meta?.permissions
  if (routePerms) {
    return auth.hasPermiOr(routePerms)
  } else if (routeRoles) {
    return roles.some((role) => routeRoles.includes(role))
  }
  return true
}

/**
 * 过滤可访问的动态路由 todo
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

export const usePermissionStore = defineStore('permission', () => {
  // 可访问的路由
  const routes = ref<RouteRecordRaw[]>([])

  // 有访问权限的动态路由
  const addRoutes = ref<RouteRecordRaw[]>([])

  // 根据角色生成可访问的 Routes
  const setRoutes = (roles: string[]) => {
    const accessedRoutes = filterDynamicRoutes(dynamicRoutes, roles)
    set(accessedRoutes)
  }

  const setAllRoutes = () => {
    set(dynamicRoutes)
  }

  // 统一设置
  const set = (accessedRoutes: RouteRecordRaw[]) => {
    routes.value = publicRoutes.concat(accessedRoutes)
    addRoutes.value = routerConfig.thirdLevelRouteCache
      ? flatMultiLevelRoutes(accessedRoutes)
      : accessedRoutes
  }

  return { routes, addRoutes, setRoutes, setAllRoutes }
})

export function usePermissionStoreOutside() {
  return usePermissionStore(pinia)
}
