<template>
  <section class="app-main">
    <div class="app-scrollbar" :class="{ 'is-full-height-page': route.meta.fullHeight }">
      <!-- 渲染错误兜底：页面 setup/render 抛错时 Vue 会卸载整棵子树，
           表现为「内容区空白、刷新后恢复」。这里捕获后给出可见提示与恢复入口，
           避免用户只能靠手动刷新猜测。 -->
      <div v-if="renderError" class="page-error">
        <el-result icon="error" :title="$t('common.messages.pageRenderError')">
          <template #extra>
            <el-button type="primary" @click="reload">
              {{ $t('common.messages.reloadPage') }}
            </el-button>
            <el-button @click="retryRender">{{ $t('common.refresh') }}</el-button>
          </template>
        </el-result>
      </div>

      <!-- 路由匹配到了但没绑定组件（后台菜单 component 为空）时，
           router-view 会渲染空内容，同样表现为「右侧空白」。
           判断必须放在 router-view 之外：<keep-alive> 只接受一个子节点，
           在它内部用 v-if/v-else 会报 "expects exactly one child component"。 -->
      <el-empty
        v-else-if="routeHasNoComponent"
        class="app-container-grow"
        :description="$t('common.messages.pageNotFound')"
      />

      <router-view v-else v-slot="{ Component, route: currentRoute }">
        <transition name="page-slide" mode="out-in">
          <keep-alive :include="tagsViewStore.cachedViews">
            <component :is="Component" :key="currentRoute.path" class="app-container-grow" />
          </keep-alive>
        </transition>
      </router-view>
      <Footer v-if="settingsStore.showFooter && !route.meta.fullHeight" />
    </div>
    <el-backtop :target="settingsStore.fixedHeader ? '.app-scrollbar' : undefined" />
  </section>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useTagsViewStore } from '@/pinia/stores/tags-view'
import { useSettingsStore } from '@/pinia/stores/settings'
import Footer from '../Footer/index.vue'

const router = useRouter()
const tagsViewStore = useTagsViewStore()

const settingsStore = useSettingsStore()

const route = useRoute()

/**
 * 页面渲染错误。
 * 捕获范围是 AppMain 之下的整棵页面子树（含异步组件加载失败）。
 * 返回 false 阻止继续向全局冒泡，但这里已经手动打印，便于排查。
 */
const renderError = shallowRef<Error | null>(null)

onErrorCaptured((error) => {
  renderError.value = error as Error
  console.error('[AppMain] 页面渲染失败：', error)
  return false
})

/**
 * 当前路由最终匹配到的记录是否没有默认组件。
 * 这种情况 router-view 会静默渲染空内容，只表现为「右侧空白」。
 */
const routeHasNoComponent = computed(() => {
  const matched = route.matched
  if (!matched.length) return false
  return !matched[matched.length - 1]?.components?.default
})

/** 诊断日志：把没有组件的路由暴露到 console，便于定位后台菜单配置问题 */
function warnIfRouteHasNoComponent() {
  if (routeHasNoComponent.value) {
    console.warn('[AppMain] 该路由没有绑定组件，内容区将为空：', {
      path: route.path,
      name: route.name,
    })
  }
}

// 切换到其它路由时清空错误，避免影响后续页面
watch(
  () => route.fullPath,
  () => {
    renderError.value = null
    warnIfRouteHasNoComponent()
  },
)

// 初次进入时也检查一次。
// 这里不用 watch 的 immediate，而是显式调用：immediate 会在 setup 期间同步执行回调，
// 一旦回调引用了声明在后面的 const，就会撞上暂时性死区（TDZ），
// setup 直接抛错 → 整个右侧内容区空白（曾经踩过）。
warnIfRouteHasNoComponent()

function reload() {
  window.location.reload()
}

/** 重新挂载当前页面：经 /redirect 中转，让页面组件整体重建一次 */
function retryRender() {
  renderError.value = null
  router
    .replace({ path: `/redirect${route.path}`, query: route.query })
    .catch(() => window.location.reload())
}
</script>

<style lang="scss" scoped>
@use '@@/assets/styles/mixins.scss';

.page-error {
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
  padding: var(--p-space-6);
}

.app-main {
  width: 100%;
  display: flex;
  background-color: var(--theme-bg-page);
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

  &.is-full-height-page {
    min-height: 0;
    overflow: hidden;

    .app-container-grow {
      min-height: 0;
    }
  }
}

.page-slide-enter-active {
  transition:
    opacity var(--p-duration-normal) ease,
    transform var(--p-duration-normal) ease;
}

.page-slide-leave-active {
  transition:
    opacity var(--p-duration-fast) ease,
    transform var(--p-duration-fast) ease;
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
