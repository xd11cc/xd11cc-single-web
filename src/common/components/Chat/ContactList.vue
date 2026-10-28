<template>
  <div class="contact-list">
    <div class="search-box">
      <el-input
        v-model="keyword"
        :placeholder="$t('chat.contactList.searchPlaceholder')"
        size="small"
        clearable
      >
        <template #prefix>
          <Icon icon="lucide:search" width="14" height="14" />
        </template>
      </el-input>
    </div>

    <el-scrollbar class="contact-scroll">
      <button
        v-for="contact in filteredContacts"
        :key="contact.userId"
        type="button"
        class="contact-item"
        :class="{ active: contact.userId === activeId }"
        :aria-current="contact.userId === activeId ? 'true' : undefined"
        @click="$emit('select', contact.userId)"
      >
        <span class="contact-avatar-wrap">
          <el-avatar
            :size="32"
            class="contact-avatar"
            :style="{ background: avatarColor(contact.userId) }"
          >
            {{ avatarText(contact.username) }}
          </el-avatar>
          <i v-if="contact.online" class="online-dot" aria-hidden="true" />
        </span>

        <span class="contact-info">
          <span class="contact-name">{{ contact.username }}</span>
          <span v-if="contact.lastMessage" class="contact-last">{{ contact.lastMessage }}</span>
        </span>

        <span class="contact-side">
          <time v-if="contact.lastTime" class="contact-time">
            {{ formatListTime(contact.lastTime, $t('chat.messageArea.yesterday')) }}
          </time>
          <el-badge v-if="contact.unread > 0" :value="contact.unread" :max="99" />
        </span>
      </button>

      <div v-if="!filteredContacts.length" class="no-contacts">
        {{ $t('chat.contactList.noOnlineUsers') }}
      </div>
    </el-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import type { ChatContact } from '@@/composables/useChat'
import { useI18n } from 'vue-i18n'
import { avatarColor, avatarText } from './avatar-color'
import { formatListTime } from './format-time'

const { t } = useI18n()
const $t = t

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
  flex-shrink: 0;
  border-right: 1px solid var(--theme-border-light);
  display: flex;
  flex-direction: column;
}

// 面板在窄屏会占满，联系人栏需要让位给消息区
@include phone {
  .contact-list {
    width: 132px;
  }
}

.search-box {
  padding: var(--p-space-2);
  border-bottom: 1px solid var(--theme-border-light);
}

.contact-scroll {
  flex: 1;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: var(--p-space-2);
  width: 100%;
  padding: var(--p-space-2) var(--p-space-3);
  border: 0;
  border-left: 2px solid transparent;
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--p-duration-fast);

  &:hover {
    background-color: var(--theme-bg-elevated);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-accent);
    outline-offset: -2px;
  }

  // 选中态：淡 accent 底 + 左侧强调条，暗色下同样可辨
  &.active {
    border-left-color: var(--theme-accent);
    background-color: var(--theme-accent-light);

    .contact-name {
      color: var(--theme-accent-strong);
      font-weight: 600;
    }
  }
}

.contact-avatar-wrap {
  position: relative;
  flex-shrink: 0;
  line-height: 0;
}

.contact-avatar {
  color: #fff;
  font-size: var(--p-text-base);
  font-weight: 600;
}

.online-dot {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 9px;
  height: 9px;
  border: 2px solid var(--theme-bg-surface);
  border-radius: 50%;
  background: var(--theme-success);
}

.contact-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--p-space-0-5);
}

.contact-name {
  font-size: var(--p-text-base);
  color: var(--theme-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-last {
  font-size: var(--p-text-xs);
  color: var(--theme-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--p-space-1);
}

.contact-time {
  font-size: var(--p-text-xs);
  color: var(--theme-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.no-contacts {
  padding: var(--p-space-6) var(--p-space-3);
  text-align: center;
  font-size: var(--p-text-sm);
  color: var(--theme-text-muted);
}
</style>
