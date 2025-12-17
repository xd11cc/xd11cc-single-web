import { defineStore } from 'pinia'
import { getTreeMenu } from '@/api/system/menu'

// 定义菜单接口
interface MenuItem {
  id: string | number
  menuName: string
  path: string
  parentId?: string | number
  children?: MenuItem[]
}

// 纯函数实现（无副作用）
export const flattenMenus = (menus: MenuItem[]): MenuItem[] => {
  return menus.reduce((result, menu) => {
    // 复制当前菜单（避免修改原对象）
    const flatMenu = { ...menu, children: undefined }
    result.push(flatMenu)
    if (menu.children && menu.children.length) {
      result.push(...flattenMenus(menu.children))
    }
    return result
  }, [] as MenuItem[])
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
