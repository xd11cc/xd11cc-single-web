/**
 * 认证失效标记。
 *
 * 响应拦截器命中 401 后会弹「登录已过期」并跳登录页；其它调用方（如路由守卫）
 * 需要知道「这次失败已经处理过」，否则会重复提示，用户看到两条内容相近的错误。
 *
 * 独立成文件而不是放进 request.ts：那个模块依赖 `@/router`，而路由守卫本身又被
 * `@/router` 导入，让守卫直接引用 request.ts 会形成
 * `router → guard → request → router` 的循环依赖。
 */

const UNAUTHORIZED_HANDLED = '__unauthorizedHandled'

/** 给错误对象打上「认证失效已处理」标记。 */
export function markUnauthorizedHandled<E>(error: E): E {
  if (error && typeof error === 'object') {
    ;(error as Record<string, unknown>)[UNAUTHORIZED_HANDLED] = true
  }
  return error
}

/**
 * 该错误是否属于「认证失效且拦截器已处理」。
 *
 * 后端认证失败统一返回 HTTP 401，这里同时认状态码与拦截器打的标记，
 * 调用方不必关心是命中拦截器的哪条分支。
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  if ((error as Record<string, unknown>)[UNAUTHORIZED_HANDLED] === true) return true
  return (error as { response?: { status?: number } }).response?.status === 401
}
