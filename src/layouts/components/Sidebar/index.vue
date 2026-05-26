<template>
  <div :class="{ 'has-logo': isLogo }">
    <Logo v-if="isLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse && !isTop"
        :collapse-transition="false"
        :mode="isTop && !isMobile ? 'horizontal' : 'vertical'"
        :class="{ 'sidebar-menu-left': isLeft }"
      >
        <Item
          v-for="noHiddenRoute in noHiddenRoutes"
          :key="noHiddenRoute.path"
          :item="noHiddenRoute"
          :base-path="noHiddenRoute.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import Item from './Item.vue'
import Logo from '../Logo/index.vue'
import { useAppStore } from '@/pinia/stores/app'
import { useLayoutMode } from '@@/composables/useLayoutMode'
import { useDevice } from '@@/composables/useDevice'
import { useSettingsStore } from '@/pinia/stores/settings'
import { usePermissionStore } from '@/pinia/stores/permission'

const appStore = useAppStore()

const { isTop, isLeft } = useLayoutMode()

const { isMobile } = useDevice()

const route = useRoute()

const settingsStore = useSettingsStore()

const permissionStore = usePermissionStore()

const activeMenu = computed(() => route.meta.activeMenu || route.path)

const noHiddenRoutes = computed(() =>
  permissionStore.routes.filter((item) => !item.meta?.hidden && (item.children?.length ?? 0) > 0),
)

const isCollapse = computed(() => !appStore.sidebar.opened)

const isLogo = computed(() => isLeft.value && settingsStore.showLogo)

const sidebarMenuItemHeight = computed(() =>
  !isTop.value ? 'var(--v3-sidebar-menu-item-height)' : 'var(--v3-navigationbar-height)',
)

const sidebarMenuHoverBgColor = computed(() =>
  !isTop.value ? 'var(--v3-sidebar-menu-hover-bg-color)' : 'transparent',
)
</script>

<style lang="scss" scoped>
.has-logo {
  .el-scrollbar {
    height: calc(100% - var(--v3-header-height));
  }
}

.el-scrollbar {
  height: 100%;
  :deep(.scrollbar-wrapper) {
    overflow-x: hidden;
  }
  :deep(.el-scrollbar__bar) {
    &.is-horizontal {
      display: none;
    }
  }
}

.el-menu {
  user-select: none;
  border: none;
  width: 100%;

  &.sidebar-menu-left {
    --el-menu-bg-color: var(--v3-sidebar-menu-bg-color);
    --el-menu-text-color: var(--v3-sidebar-menu-text-color);
    --el-menu-active-color: var(--v3-sidebar-menu-active-text-color);
    --el-menu-hover-bg-color: var(--v3-sidebar-menu-hover-bg-color);
  }
}

.el-menu--horizontal {
  height: v-bind(sidebarMenuItemHeight);
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title),
:deep(.el-sub-menu .el-menu-item),
:deep(.el-menu--horizontal .el-menu-item) {
  height: v-bind(sidebarMenuItemHeight);
  line-height: v-bind(sidebarMenuItemHeight);
  border-radius: var(--sidebar-item-radius);
  margin: 2px 8px;
  width: calc(100% - 16px);
  &.is-active,
  &:hover {
    background-color: v-bind(sidebarMenuHoverBgColor);
  }
}

:deep(.el-sub-menu) {
  &.is-active {
    > .el-sub-menu__title {
      color: var(--el-menu-active-color);
    }
  }
}

:deep(.el-menu-item.is-active) {
  background-color: var(--theme-accent-light);
  color: var(--theme-accent);
  font-weight: var(--p-weight-semibold);
}

.el-menu--collapse {
  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    margin: 2px 4px;
    width: calc(100% - 8px);
  }
  :deep(.el-sub-menu.is-active) {
    .el-sub-menu__title {
      background-color: var(--theme-accent-light);
    }
  }
}
</style>
