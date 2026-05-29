<template>
  <div class="chat-wrapper">
    <!-- 悬浮按钮 -->
    <div v-show="!panelVisible" class="chat-trigger" @click="handleOpen">
      <el-badge :value="totalUnread" :max="99" :hidden="totalUnread === 0">
        <div class="chat-trigger-btn">
          <Icon icon="lucide:message-circle" width="22" height="22" />
        </div>
      </el-badge>
    </div>

    <!-- 聊天面板 -->
    <Transition name="chat-fade">
      <ChatPanel v-show="panelVisible" @close="panelVisible = false" />
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useChat } from '@@/composables/useChat'
import ChatPanel from './ChatPanel.vue'

const { panelVisible, totalUnread, init, destroy, refreshOnlineUsers } = useChat()

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
  cursor: pointer;

  .chat-trigger-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--el-color-primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
  }
}

.chat-fade-enter-active,
.chat-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.chat-fade-enter-from,
.chat-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>
