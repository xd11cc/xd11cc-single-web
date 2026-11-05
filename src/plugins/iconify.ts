import { addCollection } from '@iconify/vue'
import subset from 'virtual:icon-subset'

/**
 * 图标注册。
 *
 * - 入口只注册「源码里用到的图标子集」（构建期由 `vite/icon-subset.ts` 生成）；
 * - 后端菜单等运行时才知道的图标，由 `ensureIconCollection` 懒加载完整集合
 *   （独立 chunk，离线可用，且只在真的遇到未知图标时下载）。
 */

/** 有随包注册的图标集，其余前缀（如 `mdi:`）交给 Iconify 在线 API */
const FULL_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  lucide: () => import('virtual:icon-full-lucide'),
  ep: () => import('virtual:icon-full-ep'),
}

let installed = false
const fullLoaded = new Set<string>()
const fullLoading = new Map<string, Promise<void>>()

export function installIconify() {
  if (installed) return
  installed = true
  for (const collection of subset) addCollection(collection)
}

/**
 * 确保某个前缀的完整图标集合可用。
 * 同一前缀并发调用只会触发一次动态 import。
 */
export function ensureIconCollection(prefix: string): Promise<void> {
  installIconify()
  const loader = FULL_LOADERS[prefix]
  if (!loader || fullLoaded.has(prefix)) return Promise.resolve()

  let task = fullLoading.get(prefix)
  if (!task) {
    task = loader().then((mod) => {
      addCollection(mod.default as Parameters<typeof addCollection>[0])
      fullLoaded.add(prefix)
      fullLoading.delete(prefix)
    })
    fullLoading.set(prefix, task)
  }
  return task
}
