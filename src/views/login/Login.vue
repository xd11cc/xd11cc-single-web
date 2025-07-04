<template>
  <div class="container">
    <div class="container-left">
      <img src="@/assets/svgs/login-box-bg.svg" alt="" />
      <div>欢迎使用本系统</div>
    </div>
    <div class="container-right">
      <LoginForm></LoginForm>
    </div>
  </div>
</template>

<script setup>
import LoginForm from '@/views/login/LoginForm.vue'
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  height: 100vh;
  width: 100%;
  &-left {
    flex: 0 0 50%; // 占据50%宽度
    background-image: url('@/assets/svgs/login-bg.svg');
  }
  &-right {
    flex: 1; // 占据剩余宽度
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    padding: 20px;
  }
}
</style>
