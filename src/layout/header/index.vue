<template>
  <div class="header-container">
    <div class="header-breadcrumb">
      <el-breadcrumb :separator-icon="ArrowRight">
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
    </div>
    <div class="header-center">
      <el-dropdown>
        <span class="el-dropdown-link">
          Dropdown List
          <el-icon class="el-icon--right">
            <arrow-down />
          </el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>Action 1</el-dropdown-item>
            <el-dropdown-item>Action 2</el-dropdown-item>
            <el-dropdown-item>Action 3</el-dropdown-item>
            <el-dropdown-item disabled>Action 4</el-dropdown-item>
            <el-dropdown-item divided>Action 5</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'
import { ref, watchEffect } from 'vue'
import { ArrowRight, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const menuStore = useMenuStore()
const breadcrumbs = ref([])

menuStore.initMenu()

// 监听路由变化，从flatMenu生成面包屑
watchEffect(() => {
  // 等待菜单加载完成
  if (!menuStore.flatMenu) return

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

  // 查找首页菜单，确保首页为面包屑的第一项
  if (breadcrumbs.value.length > 0 && breadcrumbs.value[0].label !== '首页') {
    const homeMenu = menuStore.flatMenu.find((item) => item.label === '首页')
    if (homeMenu) {
      breadcrumbs.value.unshift(homeMenu)
    }
  }
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
