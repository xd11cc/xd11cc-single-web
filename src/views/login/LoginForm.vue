<template>
  <div class="login-container">
    <el-form ref="form" :model="loginData.loginForm" :rules="loginRules" label-width="80px">
      <div class="title-container">
        <h3 class="title">登录</h3>
      </div>
      <el-form-item prop="username">
        <span class="svg-container"> </span>
        <el-input
          v-model.trim="loginData.loginForm.username"
          placeholder="请输入用户名"
          name="username"
          type="text"
        />
      </el-form-item>
      <el-form-item prop="password">
        <span class="svg-container"> </span>
        <el-input
          v-model.trim="loginData.loginForm.password"
          @keyup.enter="login"
          placeholder="请输入密码"
          name="password"
          type="password"
        />
      </el-form-item>
      <el-button type="primary" @click="login">登录</el-button>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { loginByPassword } from '@/api/login'

const loginData = reactive({
  loginForm: {
    username: '',
    password: '',
    way: 0,
    device: 0,
    app: 0,
  },
})

const validatorPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  }
  // 密码规则校验
  // const reg =
  // if(!reg.test(value)){
  // callback(new Error('...'))
  // }
  callback
}

const loginRules = ref({
  username: [
    {
      required: true,
      trigger: 'blur',
      message: '用户名不能为空',
    },
  ],
  password: [
    {
      required: true,
      trigger: 'blur',
      validator: validatorPassword,
    },
  ],
})

const login = async () => {
  const res = await loginByPassword(loginData.loginForm)
}
</script>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  .el-form {
    width: 350px;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    .title-container {
      text-align: center;
      margin-bottom: 30px;
      .title {
        color: #409eff;
        font-weight: bold;
      }
    }
    .el-form-item {
      margin-bottom: 22px;
    }
    .el-button {
      width: 100%;
      margin-top: 10px;
    }
  }
}
</style>
