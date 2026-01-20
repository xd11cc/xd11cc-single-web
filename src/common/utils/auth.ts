// 导入用户 Pinia Store（确保 useUserStore 返回的 Store 有明确的 permissions 和 roles 类型）
import { useUserStore } from '@/pinia/stores/user'

// 定义常量：超级权限标识、超级角色标识（用 const 保证只读，提升代码安全性）
const ALL_PERMISSION: string = '*:*:*'
const SUPER_ADMIN: string = 'admin'

/**
 * 底层单一权限校验函数
 * @param permission 待校验的单个权限标识（如 "system:user:list"）
 * @returns boolean - 是否拥有该权限
 */
function authPermission(permission: string): boolean {
  // 获取用户 Store 中的权限列表（明确类型为 string[]）
  const permissions: string[] = useUserStore().permissions || []
  // 入参有效性校验：非空字符串才进行校验
  if (permission && permission.trim().length > 0) {
    // 遍历用户权限列表，满足「超级权限」或「匹配目标权限」任一条件即返回 true
    return permissions.some((v: string) => {
      return v === ALL_PERMISSION || v === permission.trim()
    })
  } else {
    // 入参无效时返回无权限
    return false
  }
}

/**
 * 底层单一角色校验函数
 * @param role 待校验的单个角色标识（如 "editor"）
 * @returns boolean - 是否拥有该角色
 */
function authRole(role: string): boolean {
  // 获取用户 Store 中的角色列表（明确类型为 string[]）
  const roles: string[] = useUserStore().roles || []
  // 入参有效性校验：非空字符串才进行校验
  if (role && role.trim().length > 0) {
    // 遍历用户角色列表，满足「超级角色」或「匹配目标角色」任一条件即返回 true
    return roles.some((v: string) => {
      return v === SUPER_ADMIN || v === role.trim()
    })
  } else {
    // 入参无效时返回无权限
    return false
  }
}

// 定义权限工具对外暴露的接口（明确方法签名，提升代码可维护性和提示友好度）
interface AuthTool {
  // 单一权限校验
  hasPermi: (permission: string) => boolean
  // 多权限 或 校验（满足任一即可）
  hasPermiOr: (permissions: string[]) => boolean
  // 多权限 与 校验（必须全部满足）
  hasPermiAnd: (permissions: string[]) => boolean
  // 单一角色校验
  hasRole: (role: string) => boolean
  // 多角色 或 校验（满足任一即可）
  hasRoleOr: (roles: string[]) => boolean
  // 多角色 与 校验（必须全部满足）
  hasRoleAnd: (roles: string[]) => boolean
}

// 实现权限工具接口，并导出
const authTool: AuthTool = {
  /**
   * 验证用户是否具备某单个权限
   * @param permission 单个权限标识
   * @returns boolean
   */
  hasPermi(permission: string): boolean {
    return authPermission(permission)
  },

  /**
   * 验证用户是否含有指定权限（只需包含其中一个）
   * @param permissions 权限数组
   * @returns boolean
   */
  hasPermiOr(permissions: string[]): boolean {
    // 入参校验：非空数组才进行遍历
    if (!permissions || permissions.length === 0) {
      return false
    }
    return permissions.some((item: string) => {
      return authPermission(item)
    })
  },

  /**
   * 验证用户是否含有指定权限（必须全部拥有）
   * @param permissions 权限数组
   * @returns boolean
   */
  hasPermiAnd(permissions: string[]): boolean {
    // 入参校验：非空数组才进行遍历
    if (!permissions || permissions.length === 0) {
      return false
    }
    return permissions.every((item: string) => {
      return authPermission(item)
    })
  },

  /**
   * 验证用户是否具备某单个角色
   * @param role 单个角色标识
   * @returns boolean
   */
  hasRole(role: string): boolean {
    return authRole(role)
  },

  /**
   * 验证用户是否含有指定角色（只需包含其中一个）
   * @param roles 角色数组
   * @returns boolean
   */
  hasRoleOr(roles: string[]): boolean {
    // 入参校验：非空数组才进行遍历
    if (!roles || roles.length === 0) {
      return false
    }
    return roles.some((item: string) => {
      return authRole(item)
    })
  },

  /**
   * 验证用户是否含有指定角色（必须全部拥有）
   * @param roles 角色数组
   * @returns boolean
   */
  hasRoleAnd(roles: string[]): boolean {
    // 入参校验：非空数组才进行遍历
    if (!roles || roles.length === 0) {
      return false
    }
    return roles.every((item: string) => {
      return authRole(item)
    })
  },
}

// 默认导出权限工具对象
export default authTool
