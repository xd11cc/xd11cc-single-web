import { describe, expect, it } from 'vitest'
import { isChunkLoadError, shouldShowPageError } from '@@/utils/page-error'
import { usePageErrorBoundary } from '@@/composables/usePageErrorBoundary'

/**
 * 页面错误分类。
 *
 * 这条规则决定「接口失败时是把页面原地提示，还是整页替换成渲染失败页」，
 * 曾经因为无条件兜底，任何未捕获的接口拒绝都会把页面拆掉。
 */
describe('isChunkLoadError', () => {
  it('识别各浏览器的动态模块加载失败', () => {
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module: /a.js'))).toBe(true)
    expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('Loading chunk 12 failed'))).toBe(true)
    expect(isChunkLoadError(new Error('Unable to preload CSS for /x.css'))).toBe(true)
  })

  it('业务/请求错误不算资源加载失败', () => {
    expect(isChunkLoadError(new Error('自定义错误'))).toBe(false)
    expect(isChunkLoadError(new Error('服务器内部异常'))).toBe(false)
    expect(isChunkLoadError('network error')).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
  })
})

describe('shouldShowPageError', () => {
  it('资源加载失败 → 整页兜底（刷新可自愈）', () => {
    expect(shouldShowPageError(new Error('Failed to fetch dynamically imported module: /a.js'))).toBe(true)
  })

  it('setup / render 自身抛错 → 整页兜底（页面本来就渲染不出来）', () => {
    expect(shouldShowPageError(new Error('boom'), 'render function')).toBe(true)
    expect(shouldShowPageError(new Error('boom'), 'setup function')).toBe(true)
  })

  it('接口失败 / 事件处理器拒绝 → 不兜底，页面保持可用', () => {
    const apiError = new Error('请求失败')
    expect(shouldShowPageError(apiError, 'component event handler')).toBe(false)
    expect(shouldShowPageError(apiError, 'mounted hook')).toBe(false)
    expect(shouldShowPageError(apiError, 'watcher callback')).toBe(false)
    expect(shouldShowPageError(apiError)).toBe(false)
  })
})

describe('usePageErrorBoundary', () => {
  it('接口失败时不设置错误态（页面保持可用）', () => {
    const { error, handle } = usePageErrorBoundary('test')
    const result = handle(new Error('请求失败'), null, 'component event handler')

    expect(result).toBe(false) // 阻止继续冒泡，但不切错误页
    expect(error.value).toBeNull()
  })

  it('渲染/setup 抛错时进入错误态，clear 可复位', () => {
    const { error, handle, clear } = usePageErrorBoundary('test')

    handle(new Error('boom'), null, 'render function')
    expect(error.value?.message).toBe('boom')

    clear()
    expect(error.value).toBeNull()
  })

  it('资源加载失败进入错误态', () => {
    const { error, handle } = usePageErrorBoundary('test')
    handle(new Error('Failed to fetch dynamically imported module: /x.js'))
    expect(error.value).not.toBeNull()
  })
})
