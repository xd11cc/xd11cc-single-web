import type { LayoutsConfig } from '@/layouts/config'
import { setItem, removeItem, getItem } from '@@/utils/storage'
import { CacheKey } from '@@/constants/cache-key'
import { sidebarOpend, sidebarClosed } from '@@/constants/app-key'
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
export function setSidebarStatus(sidebarStatus: sidebarOpend | sidebarClosed) {
  setItem(CacheKey.SIDEBAR_STATUS, sidebarStatus)
}

export function getSidebarStatus() {
  return getItem(CacheKey.SIDEBAR_STATUS)
}

// 标签栏
export function getVisitedViews() {
  const json = getItem(CacheKey.VISITED_VIEW)
  return JSON.parse(json ?? '[]') as TagView[]
}

export function setVisitedViews(views: TagView[]) {
  views.forEach((view) => {
    // 删除不必要的属性，防止 JSON.stringify 处理到循环引用
    delete view.matched
    delete view.redirectedFrom
  })
  setItem(CacheKey.VISITED_VIEW, JSON.stringify(views))
}

export function getCachedViews() {
  const json = getItem(CacheKey.CACHED_VIEW)
  return JSON.parse(json ?? '[]') as string[]
}

export function setCachedViews(views: string[]) {
  setItem(CacheKey.CACHED_VIEW, JSON.stringify(views))
}
