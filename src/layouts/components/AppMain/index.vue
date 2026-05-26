<template>
  <section class="app-main">
    <div class="app-scrollbar">
      <router-view v-slot="{ Component, route }">
        <transition name="page-slide" mode="out-in">
          <keep-alive :include="tagsViewStore.cachedViews">
            <component :is="Component" :key="route.path" class="app-container-grow" />
          </keep-alive>
        </transition>
      </router-view>
      <Footer v-if="settingsStore.showFooter" />
    </div>
    <el-backtop :target="settingsStore.fixedHeader ? '.app-scrollbar' : undefined" />
  </section>
</template>

<script lang="ts" setup>
import { useTagsViewStore } from '@/pinia/stores/tags-view'
import { useSettingsStore } from '@/pinia/stores/settings'
import Footer from '../Footer/index.vue'

const tagsViewStore = useTagsViewStore()

const settingsStore = useSettingsStore()
</script>

<style lang="scss" scoped>
@use '@@/assets/styles/mixins.scss';

.app-main {
  width: 100%;
  display: flex;
}

.app-scrollbar {
  flex-grow: 1;
  overflow: auto;
  @extend %scrollbar;
  display: flex;
  flex-direction: column;
  .app-container-grow {
    flex-grow: 1;
  }
}

.page-slide-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
