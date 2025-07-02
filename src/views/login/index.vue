<template>
  <div class="container">
    <el-form ref="form" :model="loginData.loginForm" label-width="80px">
      <div class="title-container">
        <h3 class="title">登录</h3>
      </div>
      <el-form-item label="">
        <span class="svg-container"> </span>
        <el-input v-model="loginData.loginForm.username" placeholder="请输入用户名" type="text" />
        <span class="svg-container"> </span>
        <el-input v-model="loginData.loginForm.password" placeholder="请输入密码" type="password" />
      </el-form-item>
      <el-button type="primary">登录</el-button>
    </el-form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { loginByPassword } from '@/api/login'

const loginData = reactive({
  loginForm: {
    username: '',
    password: '',
  },
})
</script>

<style lang="scss" scoped></style>
