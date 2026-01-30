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
    path: '/401',
    component: () => import('@/views/error/401.vue'),
    meta: {
      hidden: true,
    },
  },
  {
    path: '/404',
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
          svgIcon: 'dashboard',
          affix: true,
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

/**
 * 动态路由
 */
export const dynamicRoutes: RouteRecordRaw[] = []

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
    // 注意：所有动态路由必须带有Name属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器（兜底）
    location.reload()
  }
}

/**
 * 注册路由导航守卫
 */
registerNavigationGuard(router)
