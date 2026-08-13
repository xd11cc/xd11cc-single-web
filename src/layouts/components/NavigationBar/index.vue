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
      <!-- 语言切换 -->
      <div class="right-menu-item">
        <el-tooltip :content="localeSwitchTip" placement="bottom">
          <button
            type="button"
            class="locale-switch"
            :aria-label="localeSwitchTip"
            @click="toggleLanguage"
          >
            <span class="locale-glyph" aria-hidden="true">
              <span class="glyph-zh">文</span>
              <span class="glyph-divider"></span>
              <span class="glyph-en">A</span>
            </span>
          </button>
        </el-tooltip>
      </div>
      <SearchMenu v-if="showSearchMenu" class="right-menu-item" />
      <Screenfull v-if="showScreenfull" class="right-menu-item" />
      <ThemeToggle class="right-menu-item" />
      <Notify class="right-menu-item" />
      <el-dropdown>
        <div class="right-menu-item user">
          <el-avatar :size="30">
            <Icon icon="lucide:user" />
          </el-avatar>
          <span>{{ userStore.username }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/user/profile">
              <el-dropdown-item>{{ t('layout.navigationBar.profile') }}</el-dropdown-item>
            </router-link>
            <el-dropdown-item divided @click="logout">{{
              t('layout.navigationBar.logout')
            }}</el-dropdown-item>
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
import SearchMenu from '@@/components/SearchMenu/index.vue'
import Screenfull from '@@/components/Screenfull/index.vue'
import ThemeToggle from '@/layouts/components/ThemeToggle/index.vue'
import Notify from '@@/components/Notify/index.vue'
import Hamburger from '@/layouts/components/Hamburger/index.vue'
import Breadcrumb from '@/layouts/components/Breadcrumb/index.vue'
import Sidebar from '@/layouts/components/Sidebar/index.vue'
import Panel from '@/layouts/components/Panel/index.vue'
import Settings from '@/layouts/components/Settings/index.vue'
import { useAppStore } from '@/pinia/stores/app'
import { useLayoutMode } from '@@/composables/useLayoutMode'
import { useDevice } from '@@/composables/useDevice'
import { useSettingsStore } from '@/pinia/stores/settings'
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/pinia/stores/user'
import { setLocale } from '@/i18n'
import { useI18n } from 'vue-i18n'

const appStore = useAppStore()

const { isTop } = useLayoutMode()

const { isMobile } = useDevice()

const userStore = useUserStore()

const router = useRouter()

const settingsStore = useSettingsStore()

const { showScreenfull, showSearchMenu, showSettings } = storeToRefs(settingsStore)

const { locale: i18nLocale, t } = useI18n()

const localeSwitchTip = computed(() =>
  i18nLocale.value === 'zh-CN'
    ? t('layout.languageSwitcher.switchToEn')
    : t('layout.languageSwitcher.switchToZh'),
)

function toggleLanguage() {
  setLocale(i18nLocale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
}

// 切换侧边栏
const toggleSidebar = () => {
  appStore.toggleSidebar(false)
}

function logout() {
  userStore.logout().then(() => {
    router.push('/login')
    ElMessage.success(t('layout.navigationBar.messages.logoutSuccess'))
  })
}
</script>

<style lang="scss" scoped>
.navigation-bar {
  height: var(--v3-navigationbar-height);
  overflow: hidden;
  color: var(--theme-text-primary);
  display: flex;
  justify-content: space-between;
  transition: color 0.3s ease;
  .hamburger {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 15px;
    cursor: pointer;
  }
  .breadcrumb {
    flex: 1;
    @media screen and (max-width: 576px) {
      display: none;
    }
  }
  .sidebar {
    flex: 1;
    min-width: 0px;
    :deep(.el-menu) {
      background-color: transparent;
    }
    :deep(.el-sub-menu) {
      &.is-active {
        .el-sub-menu__title {
          color: var(--theme-accent);
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
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin: 0 4px;
      border-radius: var(--p-radius-md);
      cursor: pointer;
      transition: background-color var(--p-duration-fast) var(--p-ease-out);

      &:hover {
        background-color: var(--theme-bg-elevated);

        :deep(svg),
        :deep(.action-icon),
        :deep(.panel-icon),
        :deep(.notify-icon) {
          color: var(--theme-accent);
        }
      }

      &:last-child {
        margin-left: 10px;
      }
    }
    .user {
      width: auto;
      height: auto;
      display: flex;
      align-items: center;
      border-radius: var(--p-radius-md);
      padding: 4px 8px;
      .el-avatar {
        margin-right: 10px;
      }
      span {
        font-size: var(--p-text-sm);
        font-weight: var(--p-weight-medium);
      }
    }
    .locale-switch {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 0;
      color: var(--theme-text-secondary);
      border: 0;
      background: transparent;

      .locale-glyph {
        position: relative;
        display: block;
        width: 23px;
        height: 21px;
        transition:
          color var(--p-duration-fast),
          transform var(--p-duration-normal) var(--p-ease-out);
      }

      .glyph-zh,
      .glyph-en {
        position: absolute;
        font-family: 'DM Sans', 'PingFang SC', sans-serif;
        font-weight: 700;
        line-height: 1;
      }

      .glyph-zh {
        top: 1px;
        left: 0;
        font-size: 15px;
      }

      .glyph-en {
        right: 0;
        bottom: 1px;
        font-size: 11px;
      }

      .glyph-divider {
        position: absolute;
        top: 10px;
        left: 9px;
        width: 9px;
        height: 1px;
        background: currentColor;
        opacity: 0.55;
        transform: rotate(-52deg);
      }

      &:hover .locale-glyph {
        color: var(--theme-accent);
        transform: translateY(-1px) rotate(-3deg);
      }
    }
  }
}
</style>
