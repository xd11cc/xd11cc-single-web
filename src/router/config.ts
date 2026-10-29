import type { RouterHistory } from 'vue-router'
import { createWebHashHistory, createWebHistory } from 'vue-router'

/**
 * 路由配置
 */
interface RouterConfig {
  /**
   * @name 路由模式
   * @description hash模式和html5模式
   */
  history: RouterHistory

  /**
   * @name 默认角色
   * @description 1、应该将所有路由都写到常驻路由里面（表明所有登录的用户能访问的页面都是一样的）
   *              2、系统自动给当前登录用户赋值一个没有任何作用的默认角色
   */
  defaultRoles: Array<string>
}

const VITE_ROUTER_HISTORY = import.meta.env.VITE_ROUTER_HISTORY

const VITE_PUBLIC_PATH = import.meta.env.VITE_PUBLIC_PATH

export const routerConfig: RouterConfig = {
  history:
    VITE_ROUTER_HISTORY === 'hash'
      ? createWebHashHistory(VITE_PUBLIC_PATH)
      : createWebHistory(VITE_PUBLIC_PATH),
  defaultRoles: ['DEFAULT_ROLE'],
}
