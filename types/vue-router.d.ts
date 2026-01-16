import type * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { SvgName } from '~virtual/svg-component'
import 'vue-router'

export {}

type ElementPlusIconsName = keyof typeof ElementPlusIconsVue

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * @description 设置该路由在侧边栏和面包屑中展示的名字
     */
    title?: string

    /**
     * @description 设置该路由的图标
     */
    svgIcon?: SvgName

    /**
     * @description 设置该路由的图标
     */
    elIcon?: ElementPlusIconsName

    /**
     * @description 默认false，设置true的时候路由不会在侧边栏出现
     */
    hidden?: boolean

    /**
     * @description 设置能进入该路由的角色，支持多个角色
     */
    roles?: string[]

    /**
     * @description 设置能访问的权限标识
     */
    permissions?: string[]

    /**
     * 默认true，如果设置为false，则不会在面包屑中显示
     */
    breadcrumb?: boolean

    /**
     * 默认false，如果设置为true，它则会固定在tags-view中
     */
    affix?: boolean

    /**
     * @description 当一个路由的children属性中声明的非隐藏子路由只有1个且该子路由为叶子节点时，会将这个子路由当作父路由显示在侧边栏。
     *              当大于1个时，会恢复成嵌套模式
     *              如果不管个数总是显示父路由，可以在父路由上设置alwaysShow: true
     */
    alwaysShow?: boolean

    /**
     * @description 示例：activeMenu: "/xxx/xxx"，
     *              当设置了该属性进入路由时，则会高亮activeMenu属性对应的侧边栏
     *              该属性适合使用在有hidden: true 属性的路由上
     */
    activeMenu?: string

    /**
     * @description 是否缓存该路由页面
     *              默认为false，为 true 时代表需要缓存，此时该路由和该页面都要设置一致的Name
     */
    keepAlive?: boolean

    /**
     * @description 路由参数
     */
    query?: string
  }
}
