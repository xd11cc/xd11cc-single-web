<template>
  <div class="message-area">
    <div class="message-header">
      <span>{{ contactName }}</span>
    </div>
    <el-scrollbar ref="scrollRef" class="message-list">
      <div ref="listRef" class="message-list-inner">
        <div v-if="!messages.length" class="no-messages">
          {{ $t('chat.messageArea.noMessages') }}
        </div>
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
        ref="inputRef"
        v-model="inputText"
        :placeholder="$t('chat.messageArea.inputPlaceholder')"
        @keydown.enter.exact.prevent="handleSend"
        maxlength="500"
      />
      <el-button type="primary" :disabled="!inputText.trim()" @click="handleSend">{{
        $t('chat.messageArea.send')
      }}</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ChatMessage } from '@@/composables/useChat'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const $t = t

const props = defineProps<{
  messages: ChatMessage[]
  contactName: string
}>()

const emit = defineEmits<{ send: [text: string] }>()

const inputText = ref('')
const inputRef = useTemplateRef('inputRef')
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

onMounted(() => {
  scrollToBottom()
  nextTick(() => {
    inputRef.value?.focus()
  })
})
</script>

<style lang="scss" scoped>
.message-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.message-header {
  padding: var(--p-space-2-5) var(--p-space-4);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: var(--p-text-md);
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.message-list {
  flex: 1;
}

.message-list-inner {
  padding: var(--p-space-3) var(--p-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--p-space-3);
}

.no-messages {
  text-align: center;
  padding: var(--p-space-10) 0;
  font-size: var(--p-text-sm);
  color: var(--el-text-color-placeholder);
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: var(--p-space-2);

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
  font-size: var(--p-text-sm);

  .self & {
    background: var(--el-color-primary-light-3);
  }
}

.msg-body {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: var(--p-space-0-5);
}

.msg-bubble {
  padding: var(--p-space-2) var(--p-space-3);
  border-radius: var(--p-radius-lg);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: var(--p-text-base);
  line-height: 1.5;
  word-break: break-word;
}

.msg-time {
  font-size: var(--p-text-xs);
  color: var(--el-text-color-placeholder);
}

.message-input {
  display: flex;
  gap: var(--p-space-2);
  padding: var(--p-space-3);
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
