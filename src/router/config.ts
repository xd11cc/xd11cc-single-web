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
   * @name 是否开启动态路由功能
   * @description 根据后端返回动态加载路由字段
   */
  dynamic: boolean

  /**
   * @name 默认角色
   * @description 1、应该将所有路由都写到常驻路由里面（表明所有登录的用户能访问的页面都是一样的）
   *              2、系统自动给当前登录用户赋值一个没有任何作用的默认角色
   */
  defaultRoles: Array<string>

  /**
   * @name 是否开启三级及其以上路由缓存功能
   * @description 1、开启后会进行路由降级（把三级及其以上的路由转化为二级路由）
   *              2、由于都会转成二级路由，所以二级及其以上路由有内嵌子路由会失效
   */
  thirdLevelRouteCache: boolean
}

const VITE_ROUTER_HISTORY = import.meta.env.VITE_ROUTER_HISTORY

const VITE_PUBLIC_PATH = import.meta.env.VITE_PUBLIC_PATH

export const routerConfig: RouterConfig = {
  history:
    VITE_ROUTER_HISTORY === 'hash'
      ? createWebHashHistory(VITE_PUBLIC_PATH)
      : createWebHistory(VITE_PUBLIC_PATH),
  dynamic: true,
  defaultRoles: ['DEFAULT_ROLE'],
  thirdLevelRouteCache: true,
}
