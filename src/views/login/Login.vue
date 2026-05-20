<template>
  <div class="container">
    <!-- 左侧品牌展示区（斜切背景） -->
    <div class="container-left">
      <div class="brand-content">
        <div class="brand-icon">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="14" fill="rgba(255,255,255,0.15)" />
            <path
              d="M16 38L28 16L40 38H16Z"
              stroke="white"
              stroke-width="2.5"
              stroke-linejoin="round"
            />
            <circle cx="28" cy="32" r="3.5" fill="white" />
          </svg>
        </div>
        <h1 class="welcome-text">欢迎使用本系统</h1>
        <p class="welcome-sub">WELCOME TO THE SYSTEM</p>
        <div class="decorative-line"></div>
      </div>
    </div>

    <!-- 右侧登录表单区 -->
    <div class="container-right">
      <BindUserForm v-if="needBind" />
      <ForgetPasswordForm v-else-if="currentForm === 'forget'" @back="currentForm = 'login'" />
      <LoginForm v-else @forget-password="currentForm = 'forget'" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import BindUserForm from './components/BindUserForm.vue'
import LoginForm from './components/LoginForm.vue'
import ForgetPasswordForm from './components/ForgetPasswordForm.vue'

const route = useRoute()
const needBind = computed(() => 'need-bind' in route.query)
const currentForm = ref<'login' | 'forget'>('login')
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  position: relative;
  height: 100vh;
  width: 100%;
  background-color: var(--business-bg);
  overflow: hidden;

  &-left {
    position: relative;
    width: 55%;
    min-width: 520px;
    background: linear-gradient(
      135deg,
      var(--business-primary-gradient-start) 0%,
      var(--business-primary-gradient-end) 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    clip-path: polygon(0 0, 100% 0, 88% 100%, 0% 100%);
    box-shadow: inset -20px 0 30px -20px rgba(0, 0, 0, 0.3);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 40px,
          rgba(255, 255, 255, 0.03) 40px,
          rgba(255, 255, 255, 0.03) 41px
        ),
        repeating-linear-gradient(
          90deg,
          transparent,
          transparent 40px,
          rgba(255, 255, 255, 0.03) 40px,
          rgba(255, 255, 255, 0.03) 41px
        ),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
      pointer-events: none;
    }

    .brand-content {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 40px;
    }

    .brand-icon {
      margin-bottom: 24px;
      display: flex;
      justify-content: center;
    }

    .welcome-text {
      margin: 0 0 12px 0;
      color: #ffffff;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 2px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      line-height: 1.3;
    }

    .welcome-sub {
      margin: 0 0 20px 0;
      color: rgba(255, 255, 255, 0.75);
      font-size: 13px;
      letter-spacing: 5px;
      font-weight: 400;
    }

    .decorative-line {
      width: 40px;
      height: 3px;
      border-radius: 2px;
      background-color: rgba(255, 255, 255, 0.85);
      margin: 0 auto;
    }
  }

  &-right {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 20px;
    box-sizing: border-box;
    overflow-y: auto;
    background-image:
      linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
    background-size: 40px 40px;
  }
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;

    &-left {
      width: 100%;
      min-width: unset;
      flex: 0 0 260px;
      clip-path: none;
      box-shadow: none;

      .welcome-text {
        font-size: 28px;
      }
      .welcome-sub {
        font-size: 12px;
        letter-spacing: 3px;
      }
    }

    &-right {
      flex: 1;
      width: 100%;
      padding: 30px 16px;
      background-image: none;
    }
  }
}
</style>
