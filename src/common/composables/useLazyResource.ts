/**
 * 幂等的「懒加载一次」封装。
 *
 * 解决的问题：页面上有多份「初次需要时才去拉、并发调用只发一次、失败可重试」的
 * 加载逻辑（菜单树、部门树、用户列表…），各写一份就会出现不同版本——有的忘记
 * 单飞、有的失败后永久卡住。这里统一成一份。
 *
 * 用法：
 *   const menuTree = createLazyLoader(async () => {
 *     const { data } = await treeList({})
 *     menuTreeData.value = data ?? []   // 数据写入放在 loader 里
 *     await nextTick()                  // 需要等渲染的也放这里
 *   })
 *   const ok = await menuTree.ensure()  // 已加载直接返回 true；并发只发一次请求
 *
 * 说明：
 * - 失败**不会**把状态钉死，下次 ensure() 会重新尝试；
 * - 需要「数据已渲染」的场景，把 `await nextTick()` 放进 loader 里，
 *   这样 ensure() 返回时节点已经存在（`setChecked` 才能生效）。
 */
export interface LazyLoader {
  /** 是否已成功加载过（非响应式，用于逻辑判断） */
  readonly loaded: boolean
  /** 确保已加载；返回是否成功。并发调用共享同一次请求 */
  ensure(): Promise<boolean>
  /** 丢弃结果，下次 ensure() 重新加载 */
  reset(): void
}

export function createLazyLoader(load: () => Promise<void>): LazyLoader {
  let status: 'idle' | 'ready' = 'idle'
  let inflight: Promise<boolean> | null = null

  return {
    get loaded() {
      return status === 'ready'
    },

    ensure(): Promise<boolean> {
      if (status === 'ready') return Promise.resolve(true)
      if (inflight) return inflight

      let task!: Promise<boolean>
      task = (async () => {
        try {
          await load()
          status = 'ready'
          return true
        } catch {
          // 保持 idle：允许下次重试，避免一次网络抖动就把功能永久禁用
          return false
        } finally {
          if (inflight === task) inflight = null
        }
      })()
      inflight = task
      return task
    },

    reset() {
      status = 'idle'
      inflight = null
    },
  }
}
