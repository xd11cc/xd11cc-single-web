<template>
  <div class="header-container">
    <div class="header-left">
      <el-icon @click="toggleCollapse">
        <component :is="isCollapse ? Expand : Flod" />
      </el-icon>
    </div>
    <div class="header-breadcrumb">
      <el-breadcrumb :separator-icon="ArrowRight">
        <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id || index">
          <el-breadcrumb-item
            v-if="index < breadcrumbs.length - 1 && crumb.path"
            :to="{ path: crumb.path }"
          >
            {{ crumb.label }}
          </el-breadcrumb-item>
          <el-breadcrumb-item v-else>
            {{ crumb.label }}
          </el-breadcrumb-item>
        </template>
      </el-breadcrumb>
    </div>
    <div class="header-action">
      <el-dropdown>
        <span class="el-dropdown-link">
          {{ nickname || '用户中心' }}
          <el-icon class="el-icon--right">
            <ArrowDown />
          </el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handlePersonCenter">个人中心</el-dropdown-item>
            <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed, onMounted, ref, watchEffect } from 'vue'
import { ArrowRight, ArrowDown, Expand, Fold } from '@element-plus/icons-vue'
import { logout } from '@/api/login/login'
import { useUserStore } from '@/stores/user'
import { useMenuStore } from '@/stores/menu'
import { ElMessage } from 'element-plus'
import router from '@/router'

const route = useRoute()
const userStore = useUserStore()
const menuStore = useMenuStore()
const breadcrumbs = ref([])
const nickname = ref('')

onMounted(async () => {
  await userStore.initMenu()
  nickname.value = userStore.userloginInfo?.nickname
})

// 监听路由变化，从flatMenu生成面包屑
watchEffect(() => {
  // 等待菜单加载完成
  if (!userStore.flatMenu) return

  const currentMenu = userStore.flatMenu.find((menu) => menu.path === route.path)
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
    const parentMenu = userStore.flatMenu.find((item) => item.id === menuItem.parentId)
    return parentMenu ? getParentCrumbs(parentMenu, crumbs) : crumbs
  }

  // 生成面包屑数组
  breadcrumbs.value = getParentCrumbs(currentMenu)

  // 查找首页菜单，确保首页为面包屑的第一项
  if (breadcrumbs.value.length > 0 && breadcrumbs.value[0].label !== '首页') {
    const homeMenu = userStore.flatMenu.find((item) => item.label === '首页')
    if (homeMenu) {
      breadcrumbs.value.unshift(homeMenu)
    }
  }
})

// 实现退出登录
const handleLogout = async () => {
  userStore
    .logout()
    .then(() => {
      ElMessage.success('退出成功')
    })
    .catch(() => {
      ElMessage.error('退出失败')
    })
}

// 跳转个人中心页面
const handlePersonCenter = () => {
  router.push('/personCenter')
}
</script>

<style lang="scss" scoped>
.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 20px;
  background-color: #fff;
}
</style>
