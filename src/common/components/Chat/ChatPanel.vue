<template>
  <div class="chat-panel">
    <div class="chat-panel-header">
      <span class="title">{{ $t('chat.title') }}</span>
      <div class="actions">
        <Icon
          icon="lucide:minus"
          width="18"
          height="18"
          class="action-btn"
          @click="$emit('close')"
        />
      </div>
    </div>
    <div class="chat-panel-body">
      <ContactList
        :contacts="contacts"
        :active-id="activeContactId"
        @select="handleSelectContact"
      />
      <MessageArea
        v-if="activeContactId"
        :messages="currentMessages"
        :contact-name="currentContactName"
        @send="handleSend"
      />
      <div v-else class="empty-chat">
        <Icon icon="lucide:message-square-dashed" width="48" height="48" />
        <span>{{ $t('chat.empty') }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useChat } from '@@/composables/useChat'
import ContactList from './ContactList.vue'
import MessageArea from './MessageArea.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const $t = t

defineEmits<{ close: [] }>()

const { contacts, activeContactId, setActiveContact, send, getMessages, refreshOnlineUsers } =
  useChat()

const currentMessages = computed(() => {
  if (!activeContactId.value) return []
  return getMessages(activeContactId.value)
})

const currentContactName = computed(() => {
  if (!activeContactId.value) return ''
  return contacts.value.find((c) => c.userId === activeContactId.value)?.username || ''
})

function handleSelectContact(userId: number) {
  setActiveContact(userId)
}

function handleSend(text: string) {
  if (!activeContactId.value) return
  send(activeContactId.value, text)
}

onMounted(() => {
  refreshOnlineUsers()
})
</script>

<style lang="scss" scoped>
.chat-panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  // 桌面 680×480，视口不够时自动收缩（原来写死尺寸，手机/小窗会超出屏幕）
  width: min(680px, calc(100vw - 32px));
  height: min(480px, calc(100vh - 120px));
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-xl);
  box-shadow: var(--theme-shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--p-space-3) var(--p-space-4);
  border-bottom: 1px solid var(--theme-border-light);
  background: var(--theme-bg-surface);

  .title {
    font-size: var(--p-text-lg);
    font-weight: 600;
    color: var(--theme-text-primary);
  }

  .actions {
    display: flex;
    gap: var(--p-space-2);
  }

  .action-btn {
    cursor: pointer;
    color: var(--theme-text-secondary);
    transition: color var(--p-duration-normal);
    &:hover {
      color: var(--theme-text-primary);
    }
  }
}

.chat-panel-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// 手机/窄窗口下占满整屏，避免 680px 面板溢出视口
@include mobile {
  .chat-panel {
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 0;
  }
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--p-space-3);
  color: var(--theme-text-muted);
}
</style>
