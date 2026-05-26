<template>
  <div>
    <!-- 全屏 -->
    <el-tooltip v-if="!content" effect="dark" :content="fullscreenTips" placement="bottom">
      <Icon icon="lucide:maximize" class="action-icon" @click="handleFullscreenClick" />
    </el-tooltip>
    <!-- 内容区 -->
    <el-dropdown v-else :disabled="isFullscreen">
      <Icon icon="lucide:maximize" class="action-icon" />
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="handleContentLargeClick">
            {{ contentLargeTips }}
          </el-dropdown-item>
          <el-dropdown-item @click="handleContentFullClick"> 内容区全屏 </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import screenfull from 'screenfull'

interface Props {
  element?: string
  openTips?: string
  exitTips?: string
  content?: boolean
}

const {
  element = 'html',
  openTips = '全屏',
  exitTips = '退出全屏',
  content = false,
} = defineProps<Props>()

const CONTENT_LARGE = 'content-large'

const CONTENT_FULL = 'content-full'

const classList = document.body.classList

const isEnabled = screenfull.isEnabled

const isFullscreen = ref<boolean>(false)

const fullscreenTips = computed(() => (isFullscreen.value ? exitTips : openTips))

function handleFullscreenClick() {
  const dom = document.querySelector(element) || undefined
  isEnabled ? screenfull.toggle(dom) : ElMessage.warning('您的浏览器无法工作')
}

function handleFullscreenChange() {
  isFullscreen.value = screenfull.isFullscreen
  isFullscreen.value || classList.remove(CONTENT_LARGE, CONTENT_FULL)
}

watchEffect(() => {
  if (isEnabled) {
    screenfull.on('change', handleFullscreenChange)
    onWatcherCleanup(() => {
      screenfull.off('change', handleFullscreenChange)
    })
  }
})

const isContentLarge = ref<boolean>(false)

const contentLargeTips = computed(() => (isContentLarge.value ? '内容区复原' : '内容区放大'))

function handleContentLargeClick() {
  isContentLarge.value = !isContentLarge.value
  classList.toggle(CONTENT_LARGE, isContentLarge.value)
}

function handleContentFullClick() {
  isContentLarge.value && handleContentLargeClick()
  classList.add(CONTENT_FULL)
  handleFullscreenClick()
}
</script>

<style lang="scss" scoped>
.action-icon {
  font-size: 18px;
  outline: none;
  cursor: pointer;
  color: var(--theme-text-secondary);
  transition: color var(--p-duration-fast);
}
</style>
