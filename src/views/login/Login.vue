<template>
  <div class="login-page">
    <!-- 几何背景 -->
    <div class="login-bg noise-bg">
      <div class="bg-dots"></div>
      <div class="bg-gradient"></div>
    </div>

    <!-- 主题切换 -->
    <button class="theme-toggle" @click="handleToggle">
      <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" />
    </button>

    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="login-header">
        <div class="logo-mark">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="url(#logo-bg)"/>
            <path d="M12 12L18.5 20L12 28H15.5L20 22L24.5 28H28L21.5 20L28 12H24.5L20 18L15.5 12H12Z" fill="white"/>
            <defs>
              <linearGradient id="logo-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stop-color="var(--theme-accent)"/>
                <stop offset="1" stop-color="#34d399"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <p class="subtitle">Enterprise Platform</p>
      </div>

      <div class="login-body">
        <BindUserForm v-if="needBind" />
        <ForgetPasswordForm v-else-if="currentForm === 'forget'" @back="currentForm = 'login'" />
        <LoginForm v-else @forget-password="currentForm = 'forget'" />
      </div>
    </div>

    <!-- 底部 -->
    <p class="login-footer">&copy; 2024 XD11CC. Built with precision.</p>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useTheme } from '@@/composables/useTheme'
import BindUserForm from './components/BindUserForm.vue'
import LoginForm from './components/LoginForm.vue'
import ForgetPasswordForm from './components/ForgetPasswordForm.vue'

const { isDark, toggleTheme } = useTheme()

function handleToggle(event: MouseEvent) {
  toggleTheme(event)
}

const route = useRoute()
const needBind = computed(() => 'need-bind' in route.query)
const currentForm = ref<'login' | 'forget'>('login')
</script>

<style lang="scss" scoped>
.login-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
  background-color: var(--theme-bg-page);
}

/* 几何点阵背景 */
.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, var(--theme-border) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.5;
}

.bg-gradient {
  position: absolute;
  width: 800px;
  height: 800px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, var(--theme-accent-glow) 0%, transparent 60%);
  filter: blur(60px);
}

/* 主题切换 */
.theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--p-radius-md);
  border: 1px solid var(--theme-border);
  background: var(--theme-bg-surface);
  color: var(--theme-text-secondary);
  cursor: pointer;
  font-size: var(--p-text-md);
  transition: all var(--p-duration-fast) var(--p-ease-out);

  &:hover {
    color: var(--theme-accent);
    border-color: var(--theme-accent);
  }
}

/* 登录卡片 */
.login-card {
  position: relative;
  z-index: 5;
  width: 100%;
  max-width: 380px;
  padding: 36px 32px;
  border-radius: var(--p-radius-xl);
  border: 1px solid var(--theme-border);
  background: var(--theme-bg-surface);
  box-shadow: var(--theme-shadow-lg);

  [data-theme='dark'] & {
    background: var(--p-gray-950);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.05),
      var(--theme-shadow-xl);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 28px;

  .logo-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;

    svg {
      filter: drop-shadow(0 4px 12px var(--theme-accent-glow));
    }
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: var(--p-text-sm);
    color: var(--theme-text-muted);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
}

.login-body {
  width: 100%;
}

.login-footer {
  position: relative;
  z-index: 5;
  margin-top: 24px;
  font-size: var(--p-text-xs);
  color: var(--theme-text-muted);
  letter-spacing: 0.3px;
}

@media (max-width: 480px) {
  .login-card {
    margin: 16px;
    padding: 28px 20px;
  }
}
</style>
