import { computed, ref } from 'vue'

/**
 * 编辑弹窗的「关联数据回填」闸门。
 *
 * 三个页面（角色/岗位/通知）原本各自编排同一套不变量，且每一处都踩过坑：
 *
 *   取依赖数据 → 每步 await 之后重新判会话 → 应用历史关联 ID → 全部就绪才允许保存
 *
 * 手写这套编排的问题在于「部分成功」很难表达：只要有一个分支自己把就绪标志置真，
 * 保存就会带着空关联提交（角色页的后端是「先删后插」，等于把权限清空）。
 *
 * 这里把不变量收成一份：
 *  - 每个步骤用 `register(key, task)` 登记，**全部为 ok 才算 ready**；
 *  - 步骤里拿到的 `isCurrent()` 同时校验「步骤未被新触发取代 + 会话未变 + 弹窗仍开」，
 *    任何一次 await 之后都必须重新调用它再写状态；
 *  - 步骤抛错或显式返回 `false` 记为失败，`error` 为真，页面据此给出提示与重试；
 *  - `restart(key)` 用于「某个依赖变化后只重跑这一步」（如数据范围切换），
 *    期间 ready 自动回落到 false。
 */

export type HydrationTaskStatus = 'idle' | 'running' | 'ok' | 'failed' | 'skipped'

export interface HydrationRunContext {
  /** 本次运行的会话号 */
  session: number
  /**
   * 这次运行是否仍然有效：步骤未被新的运行取代、会话未变、弹窗仍开着。
   * 每次 await 之后都要重新判断，避免迟到的响应写进新状态。
   */
  isCurrent: () => boolean
}

/** 返回 false 或抛错都记为失败；返回 undefined 视为成功 */
export type HydrationTask = (
  context: HydrationRunContext,
) => Promise<boolean | void> | boolean | void

export interface UseEditHydrationOptions {
  /** 会话是否仍是当前弹窗（通常传 crud.state.isCurrentSession） */
  isCurrentSession: (session: number) => boolean
  /** 弹窗是否仍打开 */
  isVisible: () => boolean
  /** 附加判定：表单对象是否仍是同一个（可选） */
  isSameTarget?: () => boolean
  /** 重试前清掉数据源缓存（如 createLazyLoader 的 reset） */
  resetSources?: () => void
}

export function useEditHydration(options: UseEditHydrationOptions) {
  const tasks = new Map<string, HydrationTask>()
  const runOnStart = new Map<string, boolean>()
  /** 每个步骤各自的「运行代号」，用于丢弃被取代的运行 */
  const tokens = new Map<string, number>()

  const session = ref<number | null>(null)
  const statuses = ref<Record<string, HydrationTaskStatus>>({})

  const keys = () => [...tasks.keys()]
  const statusOf = (key: string): HydrationTaskStatus => statuses.value[key] ?? 'idle'

  /** 步骤是否已「确认满足」：ok 表示跑过且成功，skipped 表示由别的步骤覆盖 */
  const satisfied = (key: string) => {
    const status = statusOf(key)
    return status === 'ok' || status === 'skipped'
  }
  /** 所有步骤都满足（且至少有一个步骤）才算就绪 */
  const ready = computed(() => {
    const list = keys()
    return session.value !== null && list.length > 0 && list.every(satisfied)
  })
  /** 任一步骤失败 */
  const error = computed(() => keys().some((k) => statusOf(k) === 'failed'))
  /** 是否还有步骤在跑 */
  const settling = computed(() => keys().some((k) => statusOf(k) === 'running'))

  function resetStatuses(status: HydrationTaskStatus) {
    const next: Record<string, HydrationTaskStatus> = {}
    for (const key of keys()) next[key] = status
    statuses.value = next
  }

  /**
   * 打开弹窗时的初始状态。
   *
   * 非 runOnStart 的步骤标 `skipped` 而不是 `ok`：它确实「不阻塞就绪」，
   * 但并没有执行过——重试时仍应补跑，否则「重试」按钮对它形同虚设。
   */
  function resetForStart() {
    const next: Record<string, HydrationTaskStatus> = {}
    for (const key of keys()) next[key] = runOnStart.get(key) === false ? 'skipped' : 'idle'
    statuses.value = next
  }

  /**
   * 登记一个回填步骤。
   *
   * @param runOnStart 打开弹窗时是否自动运行。默认 true；传 false 表示该步骤
   *   由别的步骤顺带完成（如「范围选项」由「详情」一并加载），只有显式
   *   `restart(key)` 时才跑——这类步骤在 start 后直接视为已满足，不阻塞就绪。
   */
  function register(key: string, task: HydrationTask, config: { runOnStart?: boolean } = {}) {
    tasks.set(key, task)
    tokens.set(key, tokens.get(key) ?? 0)
    runOnStart.set(key, config.runOnStart ?? true)
    statuses.value = { ...statuses.value, [key]: 'idle' }
  }

  /** 这一步是否还属于当前会话（会话号一致且弹窗仍然有效） */
  const belongsToCurrentSession = (expectedSession: number) =>
    session.value === expectedSession && options.isCurrentSession(expectedSession)

  async function run(key: string, expectedSession: number) {
    const task = tasks.get(key)
    if (!task) return

    // 先判会话、再动状态：过期调度若先写 token/状态，会抢走新会话的同名步骤，
    // 把它永久留在 running（历史上就是这样让保存按钮一直灰着的）。
    if (!belongsToCurrentSession(expectedSession)) return

    const token = (tokens.get(key) ?? 0) + 1
    tokens.set(key, token)

    const isCurrent = () =>
      tokens.get(key) === token &&
      session.value === expectedSession &&
      options.isCurrentSession(expectedSession) &&
      options.isVisible() &&
      (options.isSameTarget?.() ?? true)

    statuses.value = { ...statuses.value, [key]: 'running' }

    let ok = false
    try {
      ok = (await task({ session: expectedSession, isCurrent })) !== false
    } catch {
      ok = false
    }

    // 已被新的运行/会话取代：不要把结果写回状态
    if (!isCurrent()) return
    statuses.value = { ...statuses.value, [key]: ok ? 'ok' : 'failed' }
  }

  /** 新会话：重置全部步骤并重跑 */
  function start(nextSession: number) {
    session.value = nextSession
    resetForStart()
    for (const key of keys()) {
      if (runOnStart.get(key) === false) continue
      void run(key, nextSession)
    }
  }

  /** 只重跑某一步（依赖变化时用）；期间 ready 自动回落 */
  function restart(key: string) {
    const current = session.value
    if (current === null) return
    void run(key, current)
  }

  /** 结束当前会话（关闭弹窗时调用），在途结果全部作废 */
  function stop() {
    session.value = null
    for (const key of keys()) tokens.set(key, (tokens.get(key) ?? 0) + 1)
    resetStatuses('idle')
  }

  /**
   * 重试：清掉数据源缓存后，**只重跑尚未成功的步骤**。
   *
   * 不复用 `start()` 的两个原因：
   *  - `start()` 会把 `runOnStart: false` 的步骤直接标成 ok 却不执行，
   *    「重试全部步骤」的语义就落空了（该步骤失败后点重试仍然不会重新加载）；
   *  - 已成功的步骤再跑一次会把它们刚写好的状态重写一遍——例如详情步骤会把
   *     服务端数据覆盖到表单上，用户重试期间编辑的内容就丢了。
   */
  function retry() {
    const current = session.value
    if (current === null) return

    // 未确认的步骤：失败、从未执行（skipped）、被取代后卡住的都算。
    // 注意这里不能用 satisfied()——skipped 只是「不阻塞就绪」，并不代表执行过。
    const pending = keys().filter((key) => statusOf(key) !== 'ok')
    if (pending.length === 0) return

    options.resetSources?.()
    void (async () => {
      // 按登记顺序串行补跑：后面的步骤可能依赖前面的结果（如先取详情再按范围加载选项）
      for (const key of pending) {
        // 用户中途切换了记录：整轮重试立即终止，剩余步骤交给新会话自己的 start()
        if (!belongsToCurrentSession(current)) return
        statuses.value = { ...statuses.value, [key]: 'idle' }
        await run(key, current)
        if (!belongsToCurrentSession(current)) return
        if (statusOf(key) === 'failed') break
      }
    })()
  }

  return {
    ready,
    error,
    settling,
    session,
    statusOf,
    satisfied,
    register,
    start,
    restart,
    stop,
    retry,
  }
}
