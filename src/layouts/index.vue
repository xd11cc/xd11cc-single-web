<template>
  <div>
    <!-- 移动端统一降级为左侧抽屉模式 -->
    <LeftMode v-if="isMobile || isLeft" />
    <!-- 顶部布局模式（仅桌面端） -->
    <TopMode v-else-if="isTop" />
    <!-- 混合布局模式（仅桌面端） -->
    <LeftTopMode v-else-if="isLeftTop" />
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

const userStore = useUserStore()

const { connect, close: closeWs } = useWebSocket()

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

onMounted(() => {
  connect()
})

onUnmounted(() => {
  closeWs()
})
</script>
