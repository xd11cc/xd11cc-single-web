<template>
  <div>
    <!-- 布局级错误兜底：AppMain 自身 setup 抛错时，它内部的 onErrorCaptured
         来不及生效，页面会整块空白。这里在更高一层兜住，至少给出可见提示。 -->
    <el-result
      v-if="layoutError"
      icon="error"
      :title="$t('common.messages.pageRenderError')"
      :sub-title="layoutError.message"
    >
      <template #extra>
        <el-button type="primary" @click="reloadPage">
          {{ $t('common.messages.reloadPage') }}
        </el-button>
      </template>
    </el-result>

    <template v-else>
      <!-- 移动端统一降级为左侧抽屉模式 -->
      <LeftMode v-if="isMobile || isLeft" />
      <!-- 顶部布局模式（仅桌面端） -->
      <TopMode v-else-if="isTop" />
      <!-- 混合布局模式（仅桌面端） -->
      <LeftTopMode v-else-if="isLeftTop" />
    </template>

    <!-- 全局聊天面板 -->
    <Chat />
  </div>
</template>

<script lang="ts" setup>
import LeftMode from './modes/LeftMode.vue'
import TopMode from './modes/TopMode.vue'
import LeftTopMode from './modes/LeftTopMode.vue'
import Chat from '@@/components/Chat/index.vue'
import { useLayoutMode } from '@@/composables/useLayoutMode'
import { useSettingsStore } from '@/pinia/stores/settings'
import { storeToRefs } from 'pinia'
import { useDevice } from '@@/composables/useDevice'
import { useResize } from './composables/useResize'
import { useWatermark } from '@@/composables/useWatermark'
import { useUserStore } from '@/pinia/stores/user'
import { useWebSocket } from '@@/composables/useWebSocket'
import { useTheme } from '@@/composables/useTheme'

useResize()

/**
 * 布局级错误边界。
 * onErrorCaptured 只能捕获「子组件」的异常：如果 AppMain 自己的 setup 抛错，
 * 它内部的边界不会被触发（那时它还没渲染出来），只能由父级兜住。
 */
const layoutError = shallowRef<Error | null>(null)

onErrorCaptured((error) => {
  layoutError.value = error as Error
  console.error('[Layout] 布局渲染失败：', error)
  return false
})

function reloadPage() {
  window.location.reload()
}

const userStore = useUserStore()

const { connect, close: closeWs } = useWebSocket()

// 在 setup 阶段建立连接，确保子组件 mount 前 wsClient 已就绪
connect()

const { setWatermark, clearWatermark } = useWatermark()

const { isMobile } = useDevice()

const { isLeft, isTop, isLeftTop } = useLayoutMode()

const settingsStore = useSettingsStore()

const { showTagsView, showWatermark } = storeToRefs(settingsStore)

// 隐藏标签栏时通过 body class 将 tagsview 高度归零
watchEffect(() => {
  document.body.classList.toggle('hide-tagsview', !showTagsView.value)
})

// 开启或关闭系统水印
watchEffect(() => {
  showWatermark.value
    ? setWatermark(import.meta.env.VITE_APP_TITLE + '-' + userStore.username)
    : clearWatermark()
})

// 主题切换时刷新水印颜色
const { theme } = useTheme()
watch(theme, () => {
  if (showWatermark.value) {
    clearWatermark()
    setWatermark(import.meta.env.VITE_APP_TITLE + '-' + userStore.username)
  }
})

onUnmounted(() => {
  closeWs()
})
</script>
