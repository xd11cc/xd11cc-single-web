import type { RouteRecordRaw } from 'vue-router'

/**
 * 计算目录路由应当重定向到的路径。
 *
 * 后端对目录菜单发的 redirect 是字符串哨兵 `noRedirect`（语义是「这是目录，别跳」），
 * 但 `redirect` 在 vue-router 里是会被真实执行的字段——访问 /approval 会跳到 /noRedirect
 * 再命中 404。这里把它换成第一个「可见且有页面」的子路由，让目录路径落到有内容的地方。
 *
 * 纯函数：不依赖 router 实例，也不需要 Vite 的 glob，因此可以直接对它做断言。
 */
export function resolveDirRedirect(
  parentPath: string,
  children: RouteRecordRaw[],
  isLayout: (component: unknown) => boolean,
): string | undefined {
  for (const child of children) {
    if (child.meta?.hidden) continue

    const childPath = String(child.path)
    const fullPath = childPath.startsWith('/')
      ? childPath
      : `${parentPath.replace(/\/$/, '')}/${childPath}`

    // 子级也是目录时继续往下找，直到拿到真正有页面的那一层
    if (!child.component || isLayout(child.component)) {
      const nested = resolveDirRedirect(fullPath, child.children ?? [], isLayout)
      if (nested) return nested
      continue
    }

    return fullPath
  }
  return undefined
}
