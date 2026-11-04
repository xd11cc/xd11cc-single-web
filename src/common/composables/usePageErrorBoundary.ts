import { shouldShowPageError } from '@@/utils/page-error'

/**
 * 页面级错误边界（布局与 AppMain 共用）。
 *
 * 只接管「资源加载失败」和「setup/render 自身抛错」；
 * 接口失败、事件处理器里未捕获的 rejection 只记日志，不替换页面。
 *
 * 返回值里的 handle 直接传给 onErrorCaptured；返回 false 阻止继续向全局冒泡。
 */
export function usePageErrorBoundary(scope: string) {
  const error = shallowRef<Error | null>(null)

  function handle(cause: unknown, _instance?: unknown, info?: string) {
    if (!shouldShowPageError(cause, info)) {
      console.error(`[${scope}] 页面内错误（页面保持可用）：`, cause, info)
      return false
    }
    error.value = cause as Error
    console.error(`[${scope}] 渲染失败（已整页兜底）：`, cause, info)
    return false
  }

  function clear() {
    error.value = null
  }

  return { error, handle, clear }
}
