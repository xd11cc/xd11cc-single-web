import type { RouteRecordRaw, RouteComponent } from 'vue-router'
import { publicRoutes, dynamicRoutes } from '@/router/index'
import { flatMultiLevelRoutes } from '@/router/helper'
import { pinia } from '@/pinia'
import { routerConfig } from '@/router/config'
import { getRoutes } from '@/views/login/apis'
import type { RouteVO } from '@/views/login/apis/type'
import type { ComponentMap } from '@/common/assets/styles'

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
      baseRoute.component = resolveComponent(route.component)
    }

    if (route.children && route.children.length > 0) {
      baseRoute.children = transformBackendRoutes(route.children)
    }

    return baseRoute as RouteRecordRaw
  })
}

/**
 * 基础组件映射
 */
const baseComponentMap: ComponentMap = {
  // 布局组件
  Layout: () => import('@/layouts/index.vue'),
  // 通用组件
  '404': () => import('@/views/error/404.vue'),
}

// 动态组件映射
const getDynamicComponentMap = (): ComponentMap => {
  const modules = import.meta.glob('@/views/**/*.vue', { eager: false })
  const componentMap: ComponentMap = {}

  Object.keys(modules).forEach((key) => {
    // 将路径转换为组件名，例如 @/views/system/user/index.vue => system/user/index
    const componentName = key
      .replace(/^(\/src|@)\/views\//, '') // 匹配 /src/views/ 或 @/views/ 开头并替换为空
      .replace(/\.vue$/, '') // 去掉.vue后缀
    componentMap[componentName] = modules[key] as () => Promise<RouteComponent>
  })
  return componentMap
}

/**
 * 解析组件
 * @param componentPath
 * @returns
 */
const resolveComponent = (componentPath: string): RouteComponent => {
  if (!componentPath) {
    console.warn('组件路径为空，使用404页面兜底')
    return baseComponentMap['404']
  }

  // 合并基础组件和动态组件映射
  const allComponentMap = { ...baseComponentMap, ...getDynamicComponentMap() }

  // 查找匹配的组件
  if (allComponentMap[componentPath]) {
    // 使用defineAsyncComponent确保返回类型符合RouteComponent要求
    return allComponentMap[componentPath]
  }

  // 组件未找到时的兜底处理
  console.warn(`组件 "${componentPath}" 未找到，使用404页面兜底`)
  return baseComponentMap['404']
}

export const usePermissionStore = defineStore('permission', () => {
  // 可访问的路由
  const routes = ref<RouteRecordRaw[]>([])

  // 有访问权限的动态路由
  const addRoutes = ref<RouteRecordRaw[]>([])

  // 生成可访问的 Routes
  const generateRoutes = async (roles: string[]) => {
    const { data } = await getRoutes()
    const routes = transformBackendRoutes(data)
    routes.forEach((route) => {
      dynamicRoutes.push(route)
    })
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

  return { routes, addRoutes, generateRoutes, setAllRoutes }
})

export function usePermissionStoreOutside() {
  return usePermissionStore(pinia)
}
