<template>
  <section class="app-main">
    <div class="app-scrollbar">
      <!-- key 采用 route.path 和 route.fullPath 有着不同的效果，大多数的时候 path 更通用 -->
      <router-view v-slot="{ Component, route }">
        <transition name="el-fade-in" mode="out-in">
          <keep-alive :include="tagsViewStore.cachedViews">
            <component :is="Component" :key="route.path" class="app-container-grow" />
          </keep-alive>
        </transition>
      </router-view>
      <!-- 页脚 -->
      <Footer v-if="settingsStore.showFooter" />
    </div>
    <!-- 返回顶部 -->
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
</style>
