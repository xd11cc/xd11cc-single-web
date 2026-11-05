import { onScopeDispose } from 'vue'

/**
 * 过期响应守卫（列表壳与树形壳共用）。
 *
 * 解决的问题：分页/搜索连续触发时，先发的请求可能后回来，把旧数据写到新结果上。
 * 做法是为每次请求分配递增编号，只有「编号仍是最新」且「作用域未销毁」时，
 * 才允许写入数据、错误与 loading。
 *
 * 用法：
 *   const request = useLatestRequest()
 *   async function load() {
 *     if (request.isDisposed()) return
 *     const id = request.begin()
 *     const isLatest = () => request.isCurrent(id)
 *     ...
 *   }
 *
 * 为什么抽出来：这段逻辑原先在 useCrud 与 useTreeCrud 各写了一份，
 * 两边必须在「什么时候 +1」「销毁时要不要作废在途请求」上保持一致，
 * 分开维护迟早漂移。
 */
export function useLatestRequest() {
  let latestId = 0
  let disposed = false

  onScopeDispose(() => {
    disposed = true
    // 作废所有在途请求：它们回来时 isCurrent 一定为 false
    latestId += 1
  })

  return {
    /** 开始一次新请求，返回它的编号；调用后此前所有请求自动过期 */
    begin(): number {
      return ++latestId
    },
    /** 该编号是否仍是最新一次请求（且组件未销毁） */
    isCurrent(id: number): boolean {
      return !disposed && id === latestId
    },
    /** 作用域是否已销毁（用于「销毁后不再提交/不再置 loading」的判断） */
    isDisposed(): boolean {
      return disposed
    },
  }
}
