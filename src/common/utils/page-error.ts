/**
 * 页面错误的分类。
 *
 * 起因：接口报错时整页被替换成「当前页面渲染失败」——因为 Vue 会把
 * 异步事件处理器 / 生命周期钩子返回的 rejected promise 交给 onErrorCaptured，
 * 而错误边界原先无条件接管所有异常。业务失败应该在原地提示，不是把页面拆掉。
 */

/**
 * 动态 import / 资源加载类错误。
 * 这类错误刷新页面或等预构建完成通常能自愈，属于「真的需要整页兜底」的情况。
 */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk .* failed|ChunkLoadError|Unable to preload CSS/i.test(
    message,
  )
}

/**
 * 是否应该显示「页面渲染失败」整页兜底。
 *
 * 只认两类：
 *  1. 资源/动态模块加载失败（刷新可恢复）；
 *  2. 组件 setup / render 自身抛错（此时页面本来就渲染不出来）。
 *
 * 其余一律不兜底：接口失败、事件处理器里未捕获的 rejection、watcher 回调异常等，
 * 页面结构仍然可用，交给请求层 toast 或 console 记录即可。
 *
 * @param info Vue 传给 onErrorCaptured 的第三个参数，如 'render function' / 'component event handler'
 */
export function shouldShowPageError(error: unknown, info?: string): boolean {
  if (isChunkLoadError(error)) return true
  return info === 'render function' || info === 'setup function'
}
