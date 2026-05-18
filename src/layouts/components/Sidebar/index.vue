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

const tipLineWidth = computed(() => (!isTop.value ? '2px' : '0px'))
</script>

<style lang="scss" scoped>
%tip-line {
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: v-bind(tipLineWidth);
    height: 100%;
    background-color: var(--v3-sidebar-menu-tip-line-bg-color);
  }
}

.has-logo {
  .el-scrollbar {
    height: calc(100% - var(--v3-header-height));
  }
}

.el-scrollbar {
  height: 100%;
  :deep(.scrollbar-wrapper) {
    // 限制水平高度
    overflow-x: hidden;
  }
  // 滚动条
  :deep(.el-scrollbar__bar) {
    &.is-horizontal {
      // 隐藏水平滚动条
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
  @extend %tip-line;
}

.el-menu--collapse {
  :deep(.el-sub-menu.is-active) {
    .el-sub-menu__title {
      @extend %tip-line;
      background-color: v-bind(sidebarMenuHoverBgColor);
    }
  }
}
</style>
