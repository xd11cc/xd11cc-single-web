import type { RouteRecordRaw } from 'vue-router'
import { createRouter } from 'vue-router'
import { routerConfig } from './config'
import { registerNavigationGuard } from './guard'
import { flatMultiLevelRoutes } from './helper'

const Layouts = () => import('@/layouts/index.vue')

/**
 * @name 公共路由
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/redirect',
    component: Layouts,
    meta: {
      hidden: true,
    },
    children: [
      {
        path: ':path(.*)',
        component: () => import('@/views/redirect/index.vue'),
      },
    ],
  },
  {
    path: '/login',
    component: () => import('@/views/login/Login.vue'),
    meta: {
      hidden: true,
    },
  },
  {
    path: '/',
    component: Layouts,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '首页',
          icon: 'lucide:home',
          affix: true,
        },
      },
      {
        path: '/:pathMatch(.*)*',
        component: () => import('@/views/error/404.vue'),
        meta: {
          hidden: true,
        },
      },
      {
        path: '/500',
        component: () => import('@/views/error/500.vue'),
        meta: {
          hidden: true,
        },
      },
    ],
  },
  {
    path: '/user',
    component: Layouts,
    redirect: 'noredirect',
    meta: {
      hidden: true,
    },
    children: [
      {
        path: 'profile/:activeTab?',
        component: () => import('@/views/system/user/profile/index.vue'),
        name: 'Profile',
        meta: { title: '个人中心' },
      },
    ],
  },
]

// 收集公开路由的 name，用于 resetRouter 时区分公开/动态路由
const publicRouteNames = new Set(
  publicRoutes.flatMap((r) => [r.name, ...(r.children?.map((c) => c.name) || [])]).filter(Boolean),
)

/**
 * 路由实例
 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(publicRoutes) : publicRoutes,
})

/**
 * 重置路由
 */
export function resetRouter() {
  try {
    router.getRoutes().forEach((route) => {
      const { name } = route
      if (name && !publicRouteNames.has(name)) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    location.reload()
  }
}

/**
 * 注册路由导航守卫
 */
registerNavigationGuard(router)
