import { createRouter, createWebHistory } from 'vue-router'

// 公共路由
const publicRoutes = [
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/404.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404 ',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '/menu',
        name: 'Menu',
        component: () => import('@/views/menu/index.vue'),
      },
    ],
  },
]
const router = createRouter({
  history: createWebHistory(),
  routes: publicRoutes,
})

export default router
