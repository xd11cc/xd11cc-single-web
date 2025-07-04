import { createRouter, createWebHistory } from 'vue-router'

// 公共路由
const publicRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/Login.vue'),
  },
]
const router = createRouter({
  history: createWebHistory(),
  routes: publicRoutes,
})

export default router
