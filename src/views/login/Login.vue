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

const title = import.meta.env.VITE_APP_TITLE;
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  position: relative;
  min-height: 100vh; // 使用 min-height 确保内容可以撑开容器
  width: 100%;
  &-left {
    flex: 0 0 50%; // 占据50%宽度
    background-image: url('@/assets/svgs/login-bg.svg');
    background-size: cover; // 确保背景图覆盖整个区域
    background-position: center; // 确保背景图居中显示
    display: flex;
    flex-direction: column; // 垂直排列子元素
    justify-content: center; // 垂直居中
    align-items: center; // 水平居中
    position: relative; // 为内部元素定位提供参考
    > img{
      max-width: 80%;
      max-height: 60%;
      object-fit: contain;
      margin-bottom: 20px;
    }
    > div{
      color: #fff;
      font-size: 36px;
      font-weight: bold;
      text-align: center;
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
      position: relative;
      z-index: 2;
    }
  }
  &-right {
    flex: 1; // 占据剩余宽度
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #fff;
  }
}
</style>
