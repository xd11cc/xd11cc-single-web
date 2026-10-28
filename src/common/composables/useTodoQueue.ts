import type { NoticeWebSocketDTO } from '@@/utils/webSocket'

/**
 * 待办提醒队列（模块级单例）。
 *
 * 设计要点：
 * - 单例：全局只会同时存在一个待办弹窗，推送进来的待办排队展示，绝不堆叠
 * - 可延后：用户关闭弹窗只是“暂时压下去”，队列保留，铃铛角标仍是未读
 * - 去重：同一 noticeId 不会重复入队
 * - 冷却：短时间内连续到达的多条待办合并成一次弹出
 * - 不抢占：用户正在输入/编辑时会推迟弹出，避免打断录入
 */

export type TodoNotice = NoticeWebSocketDTO & { type: '3' }

// 一次弹出允许收集待办的时间窗口，超出窗口的后续待办并入下一轮
const COLLECT_WINDOW = 800

const queue = ref<TodoNotice[]>([])
const current = ref<TodoNotice | null>(null)
const visible = ref(false)
const totalCount = computed(() => queue.value.length + (current.value ? 1 : 0))

let collectTimer: ReturnType<typeof setTimeout> | null = null
let cooldownUntil = 0
const seenIds = new Set<number>()

/** 页面是否处于“用户正在录入”的状态 */
function isUserBusy(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable) return true
  // 弹窗表单/抽屉里有输入焦点时同样视为忙碌
  return Boolean(el.closest('.el-dialog, .el-drawer'))
}

function isCooldown() {
  return Date.now() < cooldownUntil
}

function openNext() {
  if (current.value || !queue.value.length) return
  current.value = queue.value.shift() ?? null
  if (current.value) visible.value = true
}

function enqueue(notice: NoticeWebSocketDTO) {
  if (!notice?.noticeId || seenIds.has(notice.noticeId)) return
  seenIds.add(notice.noticeId)
  queue.value.push(notice as TodoNotice)
}

/** 处理一条新待办：入队合并，窗口结束后统一弹出 */
function push(notice: NoticeWebSocketDTO) {
  enqueue(notice)
  if (collectTimer) {
    clearTimeout(collectTimer)
  }
  collectTimer = setTimeout(() => {
    collectTimer = null
    if (isCooldown()) {
      // 冷却期内不打扰，但待办已入队，冷却结束后补弹，不丢消息
      pendingAfterBusy = true
      return
    }
    if (isUserBusy()) {
      // 用户正在录入，等下一次输入结束时再弹
      pendingAfterBusy = true
      return
    }
    openNext()
  }, COLLECT_WINDOW)
}

// 因用户忙碌或冷却中而被推迟的弹出请求
let pendingAfterBusy = false

/**
 * 在每次交互结束后检查：如果此前因忙碌推迟过弹窗，且当前已不忙碌，则补弹。
 * 由 Notify 组件在全局事件中调用。
 */
function flushIfIdle(force = false) {
  if (!pendingAfterBusy) return
  // 冷却期内的待办保持挂起，等冷却结束后（下一次交互）再补弹
  if (!force && (isUserBusy() || isCooldown())) return
  pendingAfterBusy = false
  openNext()
}

/**
 * 关闭当前弹窗。
 * - 队列里还有待办：短暂停顿后自动切换到下一条，保证同一批待办都能被看到
 * - 队列已清空：进入冷却期，避免被后续高频待办反复打扰
 */
function dismiss() {
  visible.value = false
  current.value = null
  if (queue.value.length) {
    setTimeout(() => openNext(), 260)
  } else {
    cooldownUntil = Date.now() + 60_000
  }
}

/** 标记当前待办已处理（例如跳转后）并从队列中移除；不会影响铃铛未读数 */
function resolveCurrent() {
  visible.value = false
  current.value = null
  if (queue.value.length) setTimeout(() => openNext(), 260)
}

export function useTodoQueue() {
  return {
    queue: readonly(queue),
    current: readonly(current),
    visible,
    totalCount,
    push,
    dismiss,
    resolveCurrent,
    flushIfIdle,
  }
}
