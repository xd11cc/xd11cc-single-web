<template>
  <div>
    <!-- 左侧布局模式 -->
    <LeftMode v-if="isLeft || isMobile" />
    <!-- 顶部布局模式 -->
    <TopMode v-if="isTop" />
    <!-- 混合布局模式 -->
    <LeftTopMode v-if="isLeftTop" />
  </div>
</template>

<script lang="ts" setup>
import LeftMode from './modes/LeftMode.vue'
import TopMode from './modes/TopMode.vue'
import LeftTopMode from './modes/LeftTopMode.vue'
import { useLayoutMode } from '@@/composables/useLayoutMode'
import { useSettingsStore } from '@/pinia/stores/settings'
import { storeToRefs } from 'pinia'
import { useDevice } from '@@/composables/useDevice'
import { getCssVar, setCssVar } from '@@/utils/css'
import { useResize } from './composables/useResize'
import { useWatermark } from '@@/composables/useWatermark'
import { useUserStore } from '@/pinia/stores/user'
import { initWebSocketInstance, resetWebSocketInstance } from '@@/utils/webSocket'
import { getToken } from '@@/utils/cache/cookies'

useResize()

const userStore = useUserStore()

const { setWatermark, clearWatermark } = useWatermark()

const { isMobile } = useDevice()

const { isLeft, isTop, isLeftTop } = useLayoutMode()

const settingsStore = useSettingsStore()

const { showTagsView, showWatermark } = storeToRefs(settingsStore)

// 隐藏标签栏时删除其高度，是为了让 Logo 组件高度和 Header 区域高度始终一致
const cssVarname = '--v3-tagsview-height'

const v3Tagsviewheight = getCssVar(cssVarname)

watchEffect(() => {
  showTagsView.value ? setCssVar(cssVarname, v3Tagsviewheight) : setCssVar(cssVarname, '0px')
})

// 开启或关闭系统水印
watchEffect(() => {
  showWatermark.value
    ? setWatermark(import.meta.env.VITE_APP_TITLE + '-' + userStore.username)
    : clearWatermark()
})

onMounted(() => {
  try {
    // 重置旧的 WebSocket 实例，避免重复登录导致多个连接
    resetWebSocketInstance()
    const tokne = getToken() as string
    const wsClient = initWebSocketInstance(tokne)
    if (!wsClient) {
      return null
    }
    // 初始化连接并添加错误捕获
    wsClient.initConnect()
    return wsClient
  } catch (error) {
    return null
  }
})

onUnmounted(() => {
  resetWebSocketInstance()
})
</script>
