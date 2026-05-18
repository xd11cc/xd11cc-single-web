<template>
  <div class="app-wrapper">
    <!-- 头部导航栏和标签栏 -->
    <div class="fixed-header layout-header">
      <div class="content">
        <Logo v-if="showLogo" :collapse="false" class="logo" />
        <NavigationBar class="navigation-bar" />
      </div>
      <TagsView v-show="showTagsView" />
    </div>
    <!-- 主容器 -->
    <div :class="{ hasTagsView: showTagsView }" class="main-container">
      <AppMain class="app-main" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import Logo from '@/layouts/components/Logo/index.vue'
import NavigationBar from '@/layouts/components/NavigationBar/index.vue'
import TagsView from '@/layouts/components/TagsView/index.vue'
import AppMain from '@/layouts/components/AppMain/index.vue'
import { useSettingsStore } from '@/pinia/stores/settings'

const settingsStore = useSettingsStore()

const { showTagsView, showLogo } = storeToRefs(settingsStore)
</script>

<style lang="scss" scoped>
@use '@@/assets/styles/layout-common.scss';
$transition-time: 0.35s;

.fixed-header {
  position: fixed;
  top: 0;
  z-index: 1002;
  width: 100%;
  .logo {
    width: var(--v3-sidebar-width);
  }
  .content {
    display: flex;
    .navigation-bar {
      flex: 1;
    }
  }
}

.main-container {
  min-height: 100%;
}

.app-main {
  transition: padding-left $transition-time;
  padding-top: var(--v3-navigationbar-height);
  height: 100vh;
  overflow: auto;
}

.hasTagsView {
  .app-main {
    padding-top: var(--v3-header-height);
  }
}
</style>
