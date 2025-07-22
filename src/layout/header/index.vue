<template>
  <el-breadcrumb separator="/">
    <template v-for="(crumb, index) in breadcrumbs">
      <el-breadcrumb-item
        :key="crumb.id"
        v-if="index < breadcrumbs.length - 1"
        :to="{ path: crumb.path }"
      >
        {{ crumb.label }}
      </el-breadcrumb-item>
      <el-breadcrumb-item :key="crumb.id + '_last'" v-else>
        {{ crumb.label }}
      </el-breadcrumb-item>
    </template>
  </el-breadcrumb>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'
import { ref, watchEffect } from 'vue'

const route = useRoute()
const menuStore = useMenuStore()
const breadcrumbs = ref([])

menuStore.initMenu()

// 监听路由变化，从flatMenu生成面包屑
watchEffect(() => {
  // 等待菜单加载完成
  if (!menuStore.flatMenu.length) return

  const currentMenu = menuStore.flatMenu.find((menu) => menu.path === route.path)
  if (!currentMenu) {
    breadcrumbs.value = []
    return
  }

  // 从当前项向上追溯所有父级，生成完整路径
  const getParentCrumbs = (menuItem, crumbs = []) => {
    // 从当前项往前推
    crumbs.unshift(menuItem)
    // 没有父级时停止
    if (!menuItem.parentId) return crumbs

    // 查找父级菜单
    const parentMenu = menuStore.flatMenu.find((item) => item.id === menuItem.parentId)
    if (parentMenu) {
      return getParentCrumbs(parentMenu, crumbs)
    }
    return crumbs
  }

  // 生成面包屑数组
  breadcrumbs.value = getParentCrumbs(currentMenu)
})
</script>

<style lang="scss" scoped>
.el-breadcrumb {
  padding: 0 16px;
}

.el-breadcrumb_item:last-child .el-breadcrumb_inner {
  color: #606266;
  font-weight: normal;
}
</style>
