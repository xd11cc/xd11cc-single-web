<template>
  <div class="message-area">
    <div class="message-header">
      <span class="peer-name">{{ contactName }}</span>
      <span class="peer-status">
        <i class="peer-dot" aria-hidden="true" />
        {{ $t('chat.messageArea.online') }}
      </span>
    </div>

    <el-scrollbar ref="scrollRef" class="message-list">
      <div ref="listRef" class="message-list-inner" role="log" aria-live="polite">
        <div v-if="!rows.length" class="no-messages">
          {{ $t('chat.messageArea.noMessages') }}
        </div>

        <template v-for="row in rows" :key="row.key">
          <!-- 日期分隔线：跨天时插入，避免只看 HH:mm 分不清是哪天 -->
          <div v-if="row.type === 'day'" class="day-divider">
            <span>{{ row.label }}</span>
          </div>

          <div
            v-else
            class="message-item"
            :class="{ self: row.msg.isSelf, 'group-start': row.groupStart }"
          >
            <el-avatar
              v-if="!row.msg.isSelf"
              :size="28"
              class="msg-avatar"
              :style="{ background: avatarColor(row.msg.senderId) }"
            >
              {{ avatarText(row.msg.senderName) }}
            </el-avatar>

            <div class="msg-body">
              <div v-if="row.groupStart" class="msg-meta">
                <span v-if="!row.msg.isSelf" class="msg-sender">{{ row.msg.senderName }}</span>
                <time class="msg-clock">{{ formatClock(row.msg.timestamp) }}</time>
              </div>
              <div class="msg-bubble">{{ row.msg.text }}</div>
            </div>
          </div>
        </template>
      </div>
    </el-scrollbar>

    <div class="message-input">
      <el-input
        ref="inputRef"
        v-model="inputText"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 4 }"
        resize="none"
        :placeholder="$t('chat.messageArea.inputPlaceholder')"
        maxlength="500"
        @keydown.enter.exact.prevent="handleSend"
      />
      <div class="input-footer">
        <span class="input-hint">{{ $t('chat.messageArea.inputHint') }}</span>
        <el-button type="primary" :disabled="!inputText.trim()" @click="handleSend">
          {{ $t('chat.messageArea.send') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ChatMessage } from '@@/composables/useChat'
import { useI18n } from 'vue-i18n'
import { avatarColor, avatarText } from './avatar-color'
import { formatClock, formatDayLabel, shouldGroupWithPrev } from './format-time'

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

type Row =
  | { type: 'day'; key: string; label: string }
  | { type: 'msg'; key: string; msg: ChatMessage; groupStart: boolean }

/**
 * 把消息流摊平成「日期分隔 + 消息」，并标记每条消息是否是连续发言的第一条。
 * 分组后同一个人连发多条时不再重复显示名字与时间，视觉噪音显著下降。
 */
const rows = computed<Row[]>(() => {
  const result: Row[] = []
  let lastDay = ''
  let prev: ChatMessage | null = null

  for (const msg of props.messages) {
    const date = new Date(msg.timestamp)
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    if (dayKey !== lastDay) {
      lastDay = dayKey
      prev = null
      result.push({
        type: 'day',
        key: `day-${dayKey}`,
        label: formatDayLabel(msg.timestamp, {
          today: $t('chat.messageArea.today'),
          yesterday: $t('chat.messageArea.yesterday'),
        }),
      })
    }

    const groupStart = !shouldGroupWithPrev(prev, msg)
    result.push({ type: 'msg', key: msg.id, msg, groupStart })
    prev = msg
  }

  return result
})

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

// 新消息到达时滚到底
watch(
  () => props.messages.length,
  () => scrollToBottom(),
)

// 切换联系人时也要滚到底并聚焦输入框（原来只挂载时执行一次，切换后停在顶部）
watch(
  () => props.contactName,
  () => {
    scrollToBottom()
    nextTick(() => inputRef.value?.focus())
  },
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
  display: flex;
  align-items: center;
  gap: var(--p-space-2);
  padding: var(--p-space-2-5) var(--p-space-4);
  border-bottom: 1px solid var(--theme-border-light);
}

.peer-name {
  font-size: var(--p-text-md);
  font-weight: 600;
  color: var(--theme-text-primary);
}

.peer-status {
  display: inline-flex;
  align-items: center;
  gap: var(--p-space-1);
  font-size: var(--p-text-xs);
  color: var(--theme-text-muted);
}

.peer-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--theme-success);
}

.message-list {
  flex: 1;
}

.message-list-inner {
  display: flex;
  flex-direction: column;
  padding: var(--p-space-3) var(--p-space-4);
}

.no-messages {
  padding: var(--p-space-10) 0;
  text-align: center;
  font-size: var(--p-text-sm);
  color: var(--theme-text-muted);
}

// ── 日期分隔线 ──
.day-divider {
  display: flex;
  align-items: center;
  gap: var(--p-space-3);
  margin: var(--p-space-3) 0 var(--p-space-2);
  color: var(--theme-text-muted);
  font-size: var(--p-text-xs);

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--theme-border-light);
  }
}

// ── 消息 ──
.message-item {
  display: flex;
  align-items: flex-start;
  gap: var(--p-space-2);
  // 同一人连续发言收紧，换人时拉开
  margin-top: var(--p-space-0-5);

  &.group-start {
    margin-top: var(--p-space-3);
  }

  &.self {
    flex-direction: row-reverse;

    .msg-body {
      align-items: flex-end;
    }

    .msg-meta {
      justify-content: flex-end;
    }

    .msg-bubble {
      background: var(--theme-accent-light);
      color: var(--theme-text-primary);
      border-color: color-mix(in srgb, var(--theme-accent) 32%, transparent);
      // 气泡尾角朝自己一侧收紧
      border-bottom-right-radius: var(--p-radius-xs);
    }
  }

  &:not(.self) .msg-bubble {
    border-bottom-left-radius: var(--p-radius-xs);
  }
}

.msg-avatar {
  flex-shrink: 0;
  color: #fff;
  font-size: var(--p-text-sm);
  font-weight: 600;
}

.msg-body {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-1);
  max-width: 72%;
  min-width: 0;
}

.msg-meta {
  display: flex;
  align-items: baseline;
  gap: var(--p-space-1-5);
  font-size: var(--p-text-xs);
  color: var(--theme-text-muted);
}

.msg-sender {
  font-weight: 600;
  color: var(--theme-text-secondary);
}

.msg-clock {
  font-variant-numeric: tabular-nums;
}

.msg-bubble {
  padding: var(--p-space-1-5) var(--p-space-3);
  border: 1px solid transparent;
  border-radius: var(--p-radius-lg);
  background: var(--theme-bg-elevated);
  color: var(--theme-text-primary);
  font-size: var(--p-text-base);
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

// ── 输入区 ──
.message-input {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-2);
  padding: var(--p-space-2-5) var(--p-space-3);
  border-top: 1px solid var(--theme-border-light);
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--p-space-2);
}

.input-hint {
  font-size: var(--p-text-xs);
  color: var(--theme-text-muted);
}
</style>
