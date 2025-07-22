import { defineStore } from 'pinia'
import { getTreeMenu } from '@/api/system/menu'

export const useMenuStore = defineStore('menu', {
  state: () => {
    {
      // 存储菜单树形结构
      treeMenu: null
      // 存储扁平化后的菜单
      flatMenu: []
    }
  },
  actions: {
    // 初始化菜单
    async initMenu() {
      if (this.treeMenu) return
      const result = await getTreeMenu()
      if (result.code === 200) {
        this.treeMenu = result.data
        this.flatMenu = this.flattenMenus(result.data)
      }
    },
    // 扁平化菜单
    flattenMenus(menus, parentPath = '', result = []) {
      menus.forEach((menu) => {
        const currentPath = parentPath ? `${parentPath}/${menu.path}` : menu.path
        result.push({
          id: menu.id,
          label: menu.menuName,
          path: currentPath,
          parentId: menu.parentId,
          children: menu.children,
        })
        if (menu.children && menu.children.length) {
          this.flattenMenus(menu.children, currentPath, result)
        }
      })
      return result
    },
  },
})
