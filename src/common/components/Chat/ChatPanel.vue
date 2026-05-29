<template>
  <div class="chat-panel">
    <div class="chat-panel-header">
      <span class="title">在线聊天</span>
      <div class="actions">
        <Icon icon="lucide:minus" width="18" height="18" class="action-btn" @click="$emit('close')" />
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
        <span>选择联系人开始聊天</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useChat } from '@@/composables/useChat'
import ContactList from './ContactList.vue'
import MessageArea from './MessageArea.vue'

defineEmits<{ close: [] }>()

const { contacts, activeContactId, setActiveContact, send, getMessages, refreshOnlineUsers } = useChat()

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
  width: 680px;
  height: 480px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);

  .title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    cursor: pointer;
    color: var(--el-text-color-secondary);
    transition: color 0.2s;
    &:hover {
      color: var(--el-text-color-primary);
    }
  }
}

.chat-panel-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
