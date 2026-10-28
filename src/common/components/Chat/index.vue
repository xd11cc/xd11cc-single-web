<template>
  <div class="chat-wrapper">
    <!-- 悬浮按钮 -->
    <button
      v-show="!panelVisible"
      type="button"
      class="chat-trigger"
      :aria-label="triggerLabel"
      @click="handleOpen"
    >
      <span class="chat-trigger-btn">
        <Icon icon="lucide:message-circle" width="22" height="22" aria-hidden="true" />
        <span v-if="totalUnread > 0" class="chat-count" aria-hidden="true">
          {{ totalUnread > 99 ? '99+' : totalUnread }}
        </span>
      </span>
    </button>

    <!-- 聊天面板 -->
    <Transition name="chat-fade">
      <ChatPanel v-show="panelVisible" @close="panelVisible = false" />
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useChat } from '@@/composables/useChat'
import ChatPanel from './ChatPanel.vue'

const { panelVisible, totalUnread, init, destroy, refreshOnlineUsers } = useChat()
const { t } = useI18n()

// 未读数是纯视觉气泡，读屏拿不到，所以并进 aria-label
const triggerLabel = computed(() =>
  totalUnread.value > 0
    ? `${t('chat.title')}${t('chat.unreadSuffix', { count: totalUnread.value })}`
    : t('chat.title'),
)

function handleOpen() {
  panelVisible.value = true
  refreshOnlineUsers()
}

onMounted(() => {
  init()
})

onUnmounted(() => {
  destroy()
})
</script>

<style lang="scss" scoped>
.chat-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
}

.chat-trigger {
  display: block;
  padding: 0;
  border: 0;
  background: none;
  font-family: inherit;
  line-height: 0;
  cursor: pointer;

  .chat-trigger-btn {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--theme-accent-fill);
    color: var(--theme-accent-on);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition:
      transform 0.2s,
      box-shadow 0.2s;

    &:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
  }

  /* 内联计数气泡：el-badge 的根是 div，放进 button 属于非法嵌套 */
  .chat-count {
    position: absolute;
    top: 0;
    right: 0;
    box-sizing: border-box;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border: 1px solid var(--theme-bg-surface);
    border-radius: 8px;
    background: var(--p-red-600);
    color: #fff;
    font-family: var(--p-font-body);
    font-size: var(--p-text-xs);
    line-height: 14px;
    text-align: center;
    transform: translate(35%, -35%);
  }
}

.chat-fade-enter-active,
.chat-fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.chat-fade-enter-from,
.chat-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>
