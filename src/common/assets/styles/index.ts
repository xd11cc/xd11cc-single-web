import type { RouteComponent } from 'vue-router'

/**
 * 组件映射配置
 */
export interface ComponentMap {
  [key: string]: () => Promise<RouteComponent>
}
