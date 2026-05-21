<template>
  <div class="code-block-container">
    <el-button type="primary" link class="copy-btn" @click="handleCopy">
      <template #icon><Icon icon="ep:document-copy" /></template>
    </el-button>
    <highlightjs :language="language" :code="code" />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'

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
    ElMessage.warning('暂无代码可复制')
    return
  }
  try {
    // 优先使用现代 Clipboard API
    await navigator.clipboard.writeText(props.code)
    ElMessage.success('复制成功')
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
      ElMessage.success('复制成功')
    } catch (fallbackErr) {
      ElMessage.error('复制失败，请手动选择代码复制')
    } finally {
      document.body.removeChild(textArea)
    }
  }
}
</script>

<style lang="scss" scoped>
.code-block-container {
  position: relative;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.copy-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 10;
  color: #409eff;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 4px;
  padding: 4px 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.hljs) {
  max-height: v-bind('maxHeight');
  overflow: auto;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  font-family: 'Consolas', 'Monaco', 'Menlo', monospace;
  background: #ffffff;
  margin: 0;
}
</style>
