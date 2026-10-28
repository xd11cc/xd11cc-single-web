import type { Router, RouteLocationRaw } from 'vue-router'

/**
 * 通知/待办的业务跳转。
 *
 * 路由由后端菜单动态注册（name 来自菜单配置），未授权时 name 可能不存在，
 * 因此统一按「name → 约定期望的 path → 消息中心」逐级降级，避免跳转失败无反馈。
 */

// 审批中心（待办）期望的 path，需与后端菜单配置保持一致
const APPROVAL_TODO_PATH = '/approval/todo'
const NOTICE_CENTER_PATH = '/system/noticeUser'

function buildQuery(source: Record<string, unknown>) {
  const query: Record<string, string> = {}
  Object.entries(source).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query[key] = String(value)
  })
  return query
}

function isNavigable(router: Router, target: RouteLocationRaw) {
  try {
    return Boolean(router.resolve(target).matched.length)
  } catch {
    return false
  }
}

/**
 * 跳转到目标路由，不可达时依次降级。
 * @returns 是否成功发起跳转
 */
function pushWithFallback(router: Router, targets: RouteLocationRaw[]) {
  for (const target of targets) {
    if (!isNavigable(router, target)) continue
    router.push(target).catch(() => undefined)
    return true
  }
  return false
}

/** 打开消息中心（通知/消息的兜底落点） */
export function openNoticeCenter(router: Router) {
  return pushWithFallback(router, [{ name: 'noticeUser' }, { path: NOTICE_CENTER_PATH }])
}

/**
 * 打开审批待办。
 * 审批是高危操作，不在此处直接提交，只带着上下文进入待办页，
 * 由用户在完整信息下处理。
 */
export function openApprovalTodo(
  router: Router,
  options: { processInstanceId?: string; taskId?: string; quickApprove?: boolean },
) {
  const query = buildQuery({
    processInstanceId: options.processInstanceId,
    taskId: options.taskId,
    approve: options.quickApprove ? '1' : undefined,
  })
  return pushWithFallback(router, [
    { name: 'bpmApprovalTodo', query },
    { path: APPROVAL_TODO_PATH, query },
    { name: 'noticeUser' },
    { path: NOTICE_CENTER_PATH },
  ])
}
