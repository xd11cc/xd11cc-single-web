import type { LayoutsConfig } from '@/layouts/config'
import { setItem, removeItem, getItem } from '@@/utils/storage'
import { CacheKey } from '@@/constants/cache-key'
import { sidebarOpened, sidebarClosed } from '@@/constants/app-key'
import { TagView } from '@/pinia/stores/tags-view'

// 系统布局
export function setLayoutsConfig(settings: LayoutsConfig) {
  setItem(CacheKey.CONFIG_LAYOUT, settings)
}

export function removeLayoutsConfig() {
  removeItem(CacheKey.CONFIG_LAYOUT)
}

export function getLayoutsConfig() {
  return getItem(CacheKey.CONFIG_LAYOUT)
}

// 侧边栏状态
export function setSidebarStatus(sidebarStatus: sidebarOpened | sidebarClosed) {
  setItem(CacheKey.SIDEBAR_STATUS, sidebarStatus)
}

export function getSidebarStatus() {
  return getItem(CacheKey.SIDEBAR_STATUS)
}

// 标签栏
// 注意：getItem 内部已经 JSON.parse 过，这里不能再 parse 一次。
// 二次 parse 时，空数组会被 String([]) 转成空串，触发
// `SyntaxError: Unexpected end of JSON input`，进而在 store 初始化阶段炸掉整个布局。
export function getVisitedViews(): TagView[] {
  const views = getItem<TagView[]>(CacheKey.VISITED_VIEW)
  return Array.isArray(views) ? views : []
}

export function setVisitedViews(views: TagView[]) {
  views.forEach((view) => {
    // 删除不必要的属性，防止 JSON.stringify 处理到循环引用
    delete view.matched
    delete view.redirectedFrom
  })
  setItem(CacheKey.VISITED_VIEW, views)
}

export function getCachedViews(): string[] {
  const views = getItem<string[]>(CacheKey.CACHED_VIEW)
  return Array.isArray(views) ? views.filter((name) => typeof name === 'string') : []
}

export function setCachedViews(views: string[]) {
  setItem(CacheKey.CACHED_VIEW, views)
}
