<template>
  <div class="message-area">
    <div class="message-header">
      <span>{{ contactName }}</span>
    </div>
    <el-scrollbar ref="scrollRef" class="message-list">
      <div ref="listRef" class="message-list-inner">
        <div v-if="!messages.length" class="no-messages">暂无消息</div>
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="{ self: msg.isSelf }"
        >
          <el-avatar :size="28" class="msg-avatar">
            {{ msg.senderName?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="msg-body">
            <div class="msg-bubble">{{ msg.text }}</div>
            <div class="msg-time">{{ formatTime(msg.timestamp) }}</div>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <div class="message-input">
      <el-input
        v-model="inputText"
        placeholder="输入消息..."
        @keydown.enter.exact.prevent="handleSend"
        maxlength="500"
      />
      <el-button type="primary" :disabled="!inputText.trim()" @click="handleSend">
        发送
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ChatMessage } from '@@/composables/useChat'

const props = defineProps<{
  messages: ChatMessage[]
  contactName: string
}>()

const emit = defineEmits<{ send: [text: string] }>()

const inputText = ref('')
const scrollRef = useTemplateRef('scrollRef')
const listRef = useTemplateRef('listRef')

function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  emit('send', text)
  inputText.value = ''
}

function scrollToBottom() {
  nextTick(() => {
    scrollRef.value?.setScrollTop(listRef.value?.scrollHeight || 99999)
  })
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

watch(
  () => props.messages.length,
  () => scrollToBottom(),
)

onMounted(() => scrollToBottom())
</script>

<style lang="scss" scoped>
.message-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.message-header {
  padding: 10px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.message-list {
  flex: 1;
}

.message-list-inner {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-messages {
  text-align: center;
  padding: 40px 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  &.self {
    flex-direction: row-reverse;

    .msg-bubble {
      background: var(--el-color-primary);
      color: #fff;
    }

    .msg-time {
      text-align: right;
    }
  }
}

.msg-avatar {
  flex-shrink: 0;
  background: var(--el-fill-color-darker);
  color: #fff;
  font-size: 12px;

  .self & {
    background: var(--el-color-primary-light-3);
  }
}

.msg-body {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.msg-bubble {
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.msg-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.message-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
