<template>
  <div class="code-block-container">
    <el-button type="primary" link class="copy-btn" @click="handleCopy">
      <template #icon><Icon icon="lucide:copy" /></template>
    </el-button>
    <highlightjs :language="language" :code="code" />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 组件 Props 定义
const props = defineProps({
  // 代码内容字符串
  code: {
    type: String,
    require: true,
  },
  language: {
    type: String,
    default: 'java',
  },
  maxHeight: {
    type: String,
    default: '600px',
  },
})

const handleCopy = async () => {
  if (!props.code?.trim()) {
    ElMessage.warning(t('common.messages.noCodeToCopy'))
    return
  }
  try {
    // 优先使用现代 Clipboard API
    await navigator.clipboard.writeText(props.code)
    ElMessage.success(t('common.messages.copySuccess'))
  } catch (err) {
    // 降级方案：兼容旧浏览器
    const textArea = document.createElement('textarea')
    textArea.value = props.code
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()

    try {
      document.execCommand('copy')
      ElMessage.success(t('common.messages.copySuccess'))
    } catch (fallbackErr) {
      ElMessage.error(t('common.messages.copyFailed'))
    } finally {
      document.body.removeChild(textArea)
    }
  }
}
</script>

<style lang="scss" scoped>
.code-block-container {
  --code-block-surface: #ffffff;

  position: relative;
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-md);
  overflow: hidden;
  background: var(--theme-bg-surface);
}

.copy-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 10;
  color: var(--theme-accent-strong);
  background: var(--code-block-surface);
  border-radius: var(--p-radius-sm);
  padding: 4px 8px;
  box-shadow: var(--theme-shadow-sm);
}

:deep(.hljs) {
  max-height: v-bind('maxHeight');
  overflow: auto;
  padding: 16px;
  font-size: var(--p-text-md);
  line-height: 1.6;
  font-family: var(--p-font-mono);
  // highlight.js 使用 vs.css（亮色语法主题），代码区固定浅底，
  // 暗色模式下作为“纸张”悬浮于深色界面之上，避免深底深字不可读
  background: var(--code-block-surface);
  color: #1f2328;
  margin: 0;
}
</style>
