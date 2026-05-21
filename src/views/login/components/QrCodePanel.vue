<template>
  <div class="qrcode-panel">
    <div class="qrcode-box">
      <div class="qrcode-placeholder" :class="{ expired: isExpired }">
        <Icon v-if="!isExpired" icon="ep:monitor" width="64" height="64" class="qrcode-icon" />
        <div v-if="isExpired" class="expired-mask" @click="handleRefresh">
          <Icon icon="ep:refresh-right" width="28" height="28" />
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
  padding: 20px 0 10px;
}

.qrcode-box {
  margin-bottom: 24px;
}

.qrcode-placeholder {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  border: 1px solid var(--business-border);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafbfc;
  position: relative;
  overflow: hidden;
  transition: border-color 0.25s;

  &:hover {
    border-color: var(--business-primary);
  }

  .qrcode-icon {
    color: var(--business-text-placeholder);
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
  background-color: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: var(--business-primary);
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.92);
  }
}

.tip-text {
  margin: 0 0 6px;
  font-size: 15px;
  color: var(--business-text);
  font-weight: 500;
}

.tip-sub {
  margin: 0;
  font-size: 13px;
  color: var(--business-text-placeholder);
}
</style>
