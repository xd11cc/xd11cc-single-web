<template>
  <div class="qrcode-panel">
    <div class="qrcode-box">
      <div class="qrcode-placeholder" :class="{ expired: isExpired }">
        <Icon v-if="!isExpired" icon="lucide:monitor" width="64" height="64" class="qrcode-icon" />
        <div v-if="isExpired" class="expired-mask" @click="handleRefresh">
          <Icon icon="lucide:refresh-cw" width="28" height="28" />
          <span>点击刷新</span>
        </div>
      </div>
    </div>
    <p class="tip-text">请使用手机扫描二维码</p>
    <p class="tip-sub">扫描后在手机端确认登录</p>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'

const isExpired = ref(false)

function handleRefresh() {
  isExpired.value = false
}
</script>

<style lang="scss" scoped>
.qrcode-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--p-space-5) 0 var(--p-space-2);
}

.qrcode-box {
  margin-bottom: var(--p-space-6);
}

.qrcode-placeholder {
  width: 200px;
  height: 200px;
  border-radius: var(--p-radius-xl);
  border: 1px solid var(--theme-border);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--theme-bg-elevated);
  position: relative;
  overflow: hidden;
  transition: border-color var(--p-duration-fast);

  &:hover {
    border-color: var(--theme-accent);
  }

  .qrcode-icon {
    color: var(--theme-text-muted);
  }

  &.expired {
    .qrcode-icon {
      filter: blur(3px);
      opacity: 0.3;
    }
  }
}

.expired-mask {
  position: absolute;
  inset: 0;
  background-color: var(--theme-bg-surface);
  opacity: 0.9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--p-space-2);
  cursor: pointer;
  color: var(--theme-accent);
  font-size: var(--p-text-sm);
  font-weight: var(--p-weight-medium);
  transition: opacity var(--p-duration-fast);

  &:hover {
    opacity: 0.95;
  }
}

.tip-text {
  margin: 0 0 6px;
  font-size: var(--p-text-md);
  color: var(--theme-text-primary);
  font-weight: var(--p-weight-medium);
}

.tip-sub {
  margin: 0;
  font-size: var(--p-text-xs);
  color: var(--theme-text-muted);
}
</style>
