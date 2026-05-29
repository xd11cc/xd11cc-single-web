<template>
  <div class="contact-list">
    <div class="search-box">
      <el-input v-model="keyword" placeholder="搜索用户" size="small" clearable>
        <template #prefix>
          <Icon icon="lucide:search" width="14" height="14" />
        </template>
      </el-input>
    </div>
    <el-scrollbar class="contact-scroll">
      <div
        v-for="contact in filteredContacts"
        :key="contact.userId"
        class="contact-item"
        :class="{ active: contact.userId === activeId }"
        @click="$emit('select', contact.userId)"
      >
        <el-avatar :size="32" class="contact-avatar">
          {{ contact.username?.charAt(0)?.toUpperCase() }}
        </el-avatar>
        <div class="contact-info">
          <span class="contact-name">{{ contact.username }}</span>
          <span v-if="contact.lastMessage" class="contact-last">{{ contact.lastMessage }}</span>
        </div>
        <el-badge v-if="contact.unread > 0" :value="contact.unread" :max="99" class="contact-badge" />
      </div>
      <div v-if="!filteredContacts.length" class="no-contacts">
        暂无在线用户
      </div>
    </el-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import type { ChatContact } from '@@/composables/useChat'

const props = defineProps<{
  contacts: ChatContact[]
  activeId: number | null
}>()

defineEmits<{ select: [userId: number] }>()

const keyword = ref('')

const filteredContacts = computed(() => {
  if (!keyword.value) return props.contacts
  const kw = keyword.value.toLowerCase()
  return props.contacts.filter((c) => c.username.toLowerCase().includes(kw))
})
</script>

<style lang="scss" scoped>
.contact-list {
  width: 200px;
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.contact-scroll {
  flex: 1;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &.active {
    background-color: var(--el-color-primary-light-9);
  }
}

.contact-avatar {
  flex-shrink: 0;
  background: var(--el-color-primary-light-5);
  color: #fff;
  font-size: 13px;
}

.contact-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-last {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-badge {
  flex-shrink: 0;
}

.no-contacts {
  padding: 24px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
