import type { App, Directive } from 'vue'
import { isArray } from '@@/utils/validate'
import { useUserStore } from '@/pinia/stores/user'

/**
 * @name 权限指令
 * @description 和权限判断函数 checkPermission 功能类似
 */
const permission: Directive = {
  mounted(el, binding) {
    const { value: permissionFlag } = binding
    const all_permission = '*:*:*'
    const { permissions } = useUserStore()
    if (isArray(permissionFlag) && permissionFlag.length > 0) {
      const hasPermission = permissions.some(
        (permission) => all_permission === permission || permissionFlag.includes(permission),
      )
      hasPermission || el.parentNode?.removeChild(el)
    } else {
      throw new Error(`请设置操作权限标签值`)
    }
  },
}

export function installPermissionDirective(app: App) {
  app.directive('permission', permission)
}
