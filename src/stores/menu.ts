import { defineStore } from 'pinia'
import { getTreeMenu } from '@/api/system/menu'
import type { TreeMenuVO } from '@/types'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    // 用MenuItem类型约束菜单数据
    treeMenu: null as TreeMenuVO[] | null,
    flatMenu: [] as TreeMenuVO[], // 明确类型为扁平化后的菜单数组
  }),
  actions: {
    async initMenu() {
      if (this.treeMenu) return
      const result = await getTreeMenu()
      if (result.code === 200) {
        this.treeMenu = result.data
        // 直接调用纯函数，传入原始菜单数据
        this.flatMenu = flattenMenus(result.data)
      }
    },
    // 移除原有的flattenMenus方法（已改为纯函数）
  },
})

// 纯函数实现（无副作用）
export const flattenMenus = (menus: TreeMenuVO[]): TreeMenuVO[] => {
  const result: TreeMenuVO[] = []
  const stack = [...menus] // 用栈模拟递归
  while (stack.length) {
    const menu = stack.pop()!
    result.push({ ...menu, children: undefined })
    if (menu.children && menu.children.length) {
      stack.push(...menu.children) // 子菜单入栈
    }
  }
  return result
}
// export const useMenuStore = defineStore('menu', {
//   state: () => {
//     {
//       // 存储菜单树形结构
//       treeMenu: null
//       // 存储扁平化后的菜单
//       flatMenu: []
//     }
//   },
//   actions: {
//     // 初始化菜单
//     async initMenu() {
//       if (this.treeMenu) return
//       const result = await getTreeMenu()
//       if (result.code === 200) {
//         this.treeMenu = result.data
//         this.flatMenu = this.flattenMenus(result.data)
//       }
//     },
//     // 扁平化菜单
//     flattenMenus(menus, result = []) {
//       menus.forEach((menu) => {
//         result.push({
//           id: menu.id,
//           label: menu.menuName,
//           path: menu.path,
//           parentId: menu.parentId,
//           children: menu.children,
//         })
//         if (menu.children && menu.children.length) {
//           this.flattenMenus(menu.children, result)
//         }
//       })
//       return result
//     },
//   },
// })
