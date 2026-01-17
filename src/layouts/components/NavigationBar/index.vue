<template>
  <div class="navigation-bar">
    <Hamburger
      v-if="!isTop || isMobile"
      :is-active="appStore.sidebar.opened"
      class="hamburger"
      @toggle-click="toggleSidebar"
    />
    <Breadcrumb v-if="!isTop || isMobile" class="breadcrumb" />
    <Sidebar v-if="isTop && !isMobile" class="sidebar" />
    <div class="right-menu">
      <SearchMenu v-if="showSearchMenu" class="right-menu-item" />
      <Screenfull v-if="showScreenfull" class="right-menu-item" />
      <Notify class="right-menu-item" />
      <el-dropdown>
        <div class="right-menu-item user">
          <el-avatar :icon="UserFilled" :size="30" />
          <span>{{ userStore.username }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/user/profile">
              <el-dropdown-item>个人中心</el-dropdown-item>
            </router-link>
            <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <Panel v-if="showSettings" class="right-menu-item">
        <Settings />
      </Panel>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Hamburger from '@/layouts/components/Hamburger/index.vue'
import Breadcrumb from '@/layouts/components/Breadcrumb/index.vue'
import Sidebar from '@/layouts/components/Sidebar/index.vue'
import Panel from '@/layouts/components/Panel/index.vue'
import Settings from '@/layouts/components/Settings/index.vue'
import { useAppStore } from '@/pinia/stores/app'
import { useLayoutMode } from '@/composables/useLayoutMode'
import { useDevice } from '@/composables/useDevice'
import { useSettingsStore } from '@/pinia/stores/settings'
import { UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/pinia/stores/user'

const appStore = useAppStore()

const { isTop } = useLayoutMode()

const { isMobile } = useDevice()

const userStore = useUserStore()

const router = useRouter()

const settingsStore = useSettingsStore()

const { showScreenfull, showSearchMenu, showSettings } = storeToRefs(settingsStore)

// 切换侧边栏
const toggleSidebar = () => {
  appStore.toggleSidebar(false)
}

function logout() {
  userStore.logout().then(() => {
    router.push('/login')
  })
}
</script>

<style lang="scss" scoped>
.navigation-bar {
  height: var(--v3-navigationbar-height);
  overflow: hidden;
  color: var(--v3-navigationbar-text-color);
  display: flex;
  justify-content: space-between;
  .hamburger {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 15px;
    cursor: pointer;
  }
  .breadcrumb {
    flex: 1;
    // 参考 Bootstrap 的响应式设计将宽度设置为 576
    @media screen and (max-width: 576px) {
      display: none;
    }
  }
  .sidebar {
    flex: 1;
    // 设置 min-width 是为了让 Sidebar 里的 el-menu 宽度自适应
    min-width: 0px;
    :deep(.el-menu) {
      background-color: transparent;
    }
    :deep(.el-sub-menu) {
      &.is-active {
        .el-sub-menu__title {
          color: var(--el-color-primary);
        }
      }
    }
  }
  .right-menu {
    margin-right: 10px;
    height: 100%;
    display: flex;
    align-items: center;
    &-item {
      margin: 0 10px;
      cursor: pointer;
      &:last-child {
        margin-left: 20px;
      }
    }
    .user {
      display: flex;
      align-items: center;
      .el-avatar {
        margin-right: 10px;
      }
      span {
        font-size: 16px;
      }
    }
  }
}
</style>
