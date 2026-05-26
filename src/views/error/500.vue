<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">
        <span class="digit">5</span>
        <span class="digit accent">0</span>
        <span class="digit">0</span>
      </div>
      <div class="error-illustration">
        <Icon icon="lucide:server-crash" class="error-icon" />
      </div>
      <h2 class="error-title">服务器错误</h2>
      <p class="error-description">抱歉，服务器遇到了内部错误，无法完成您的请求。请稍后再试或联系技术支持。</p>
      <div class="error-actions">
        <el-button type="primary" size="large" @click="router.push('/')">
          <template #icon><Icon icon="lucide:home" /></template>
          返回首页
        </el-button>
        <el-button size="large" @click="handleRefresh">
          <template #icon><Icon icon="lucide:refresh-cw" /></template>
          刷新页面
        </el-button>
      </div>
    </div>
    <div class="error-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'

const router = useRouter()

function handleRefresh() {
  window.location.reload()
}
</script>

<style lang="scss" scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--p-space-4);
  position: relative;
  overflow: hidden;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;
  animation: fade-up 0.6s var(--p-ease-out) both;
}

.error-code {
  display: flex;
  gap: 4px;
  margin-bottom: var(--p-space-4);

  .digit {
    font-family: var(--p-font-display);
    font-size: 64px;
    font-weight: var(--p-weight-bold);
    color: var(--theme-text-primary);
    line-height: 1;
    opacity: 0.15;

    &.accent {
      color: var(--theme-danger);
      opacity: 0.6;
    }
  }
}

.error-illustration {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--p-space-4);

  .error-icon {
    font-size: 28px;
    color: var(--theme-danger);
  }
}

.error-title {
  margin: 0 0 var(--p-space-2);
  font-family: var(--p-font-display);
  font-size: var(--p-text-xl);
  font-weight: var(--p-weight-bold);
  color: var(--theme-text-primary);
}

.error-description {
  margin: 0 0 var(--p-space-6);
  font-size: var(--p-text-sm);
  color: var(--theme-text-muted);
  max-width: 360px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: var(--p-space-3);

  :deep(.el-button--primary) {
    border: none;
    border-radius: var(--btn-radius);
    font-family: var(--p-font-display);
    font-weight: var(--p-weight-semibold);
    background: var(--theme-accent);
    color: #ffffff;
    transition: all var(--p-duration-fast) var(--p-ease-out);

    &:hover {
      background: var(--theme-accent-hover);
      box-shadow: 0 4px 12px var(--theme-accent-glow);
    }
  }

  :deep(.el-button--default) {
    border-radius: var(--btn-radius);
    font-family: var(--p-font-display);
    font-weight: var(--p-weight-medium);
    border: 1px solid var(--theme-border);
    background: var(--theme-bg-surface);
    color: var(--theme-text-secondary);
    transition: all var(--p-duration-fast) var(--p-ease-out);

    &:hover {
      border-color: var(--theme-accent);
      color: var(--theme-accent);
    }
  }
}

.error-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .circle {
    position: absolute;
    border-radius: 50%;
    border: 1px solid var(--theme-border);
    opacity: 0.4;
  }

  .circle-1 {
    width: 280px;
    height: 280px;
    bottom: -80px;
    right: -60px;
    animation: float 8s ease-in-out infinite;
  }

  .circle-2 {
    width: 220px;
    height: 220px;
    top: -60px;
    left: -50px;
    animation: float 7s ease-in-out infinite reverse;
  }

  .circle-3 {
    width: 140px;
    height: 140px;
    top: 25%;
    right: 10%;
    border-color: var(--theme-danger);
    opacity: 0.12;
    animation: float 10s ease-in-out infinite;
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-12px) rotate(3deg);
  }
}
</style>
