import type { App, Directive } from 'vue'
import { i18n } from '@/i18n'

/**
 * 统一表格/内容区加载态。
 *
 * 背景：项目里此前并存两套加载表达 —— 13 个页面用 Element Plus 的 v-loading
 * 转圈 + 深色遮罩，5 个迁移到共享壳的页面用自定义「扫描线」；
 * 共享壳与 TreeTable 又各自复制了一份几乎相同的扫描线实现。
 *
 * 这里把扫描线收成一个指令，取代 v-loading：
 *   - 用法与 v-loading 一致（`v-table-loading="loading"`），页面模板改动最小
 *   - 遮罩元素由指令创建，自带 role="status" / aria-live，无障碍语义不丢
 *   - 视觉（遮罩浓度、扫描线、动画）集中在 index.scss，只有一套
 */
const MASK_CLASS = 'v-table-loading'
const MASK_KEY = '__vTableLoadingMask'

type ElWithMask = HTMLElement & { [MASK_KEY]?: HTMLElement }

function createMask(): HTMLElement {
  const mask = document.createElement('div')
  mask.className = MASK_CLASS
  mask.setAttribute('role', 'status')
  mask.setAttribute('aria-live', 'polite')
  mask.setAttribute('aria-label', i18n.global.t('common.loading'))
  return mask
}

function toggle(el: ElWithMask, loading: boolean) {
  const mask = el[MASK_KEY]
  if (!mask) return
  mask.classList.toggle('is-active', Boolean(loading))
}

const tableLoading: Directive<ElWithMask, boolean> = {
  mounted(el, binding) {
    // 遮罩用 absolute 定位铺满宿主，宿主必须能作为定位参照
    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative'
    }
    const mask = createMask()
    el.appendChild(mask)
    el[MASK_KEY] = mask
    toggle(el, binding.value)
  },

  updated(el, binding) {
    toggle(el, binding.value)
  },

  unmounted(el) {
    el[MASK_KEY]?.remove()
    delete el[MASK_KEY]
  },
}

export function installTableLoadingDirective(app: App) {
  app.directive('table-loading', tableLoading)
}
