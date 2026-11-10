/**
 * 权限初始化的单飞状态。
 *
 * 放在独立模块里是为了打破循环依赖：守卫要用它做单飞，
 * 用户 store 在登出时需要把它清掉（否则新账号的导航会 await 上一个会话的 Promise）。
 */
let pending: Promise<void> | null = null

export function getPermissionInitialization(): Promise<void> | null {
  return pending
}

export function setPermissionInitialization(value: Promise<void> | null): void {
  pending = value
}

/** 登出/换号时调用：让后续导航重新走一次初始化 */
export function resetPermissionInitialization(): void {
  pending = null
}
