import router from '@/router'
import { useUserStore } from './stores/user'

// 不需要token的白名单页面
const whiteList = ['/login', '/404']
// to：跳到哪里去
// from：从哪里来
// next：是否要去
router.beforeEach((to, from, next) => {
  const useStore = useUserStore()
  // 1、如果用户已经登陆，则不允许进入login
  if (useStore.token) {
    if (to.path === '/login') {
      // 确保菜单已加载（动态菜单场景）
      if (!useStore.treeMenu) {
        useStore.initMenu()
      }
      next('/')
    } else {
      next()
    }
  } else {
    // 如果用户未登录，则只允许进入login
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next('/login')
    }
  }
})
