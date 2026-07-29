<template>
  <div>
    <!-- 全屏 -->
    <el-tooltip v-if="!props.content" effect="dark" :content="fullscreenTips" placement="bottom">
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
          <el-dropdown-item @click="handleContentFullClick">{{
            t('layout.screenfull.contentFull')
          }}</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import screenfull from 'screenfull'
import { useI18n } from 'vue-i18n'

interface Props {
  element?: string
  openTips?: string
  exitTips?: string
  content?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  element: 'html',
  content: false,
})

const { t } = useI18n()

const CONTENT_LARGE = 'content-large'

const CONTENT_FULL = 'content-full'

const classList = document.body.classList

const isEnabled = screenfull.isEnabled

const isFullscreen = ref<boolean>(false)

const fullscreenTips = computed(() =>
  isFullscreen.value
    ? props.exitTips || t('layout.screenfull.exit')
    : props.openTips || t('layout.screenfull.open'),
)

function handleFullscreenClick() {
  const dom = document.querySelector(props.element) || undefined
  isEnabled ? screenfull.toggle(dom) : ElMessage.warning(t('layout.screenfull.notSupported'))
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

const contentLargeTips = computed(() =>
  isContentLarge.value ? t('layout.screenfull.contentRestore') : t('layout.screenfull.contentZoom'),
)

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
