<template>
  <div class="login-container">
    <el-form ref="form" :model="loginData.loginForm" :rules="loginRules" label-width="80px">
      <div class="title-container">
        <h3 class="title">登录</h3>
      </div>
      <el-form-item prop="username">
        <el-input
          v-model.trim="loginData.loginForm.username"
          placeholder="请输入用户名"
          name="username"
          type="text"
        />
      </el-form-item>
      <el-form-item prop="password">
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
    width: 460px;
    padding: 40px;
    border-radius: 12px;
    background: white;
    box-sizing: border-box;
    .title-container {
      text-align: center;
      margin-bottom: 32;
      .title {
        font-size: 28px;
        font-weight: 600;
        color: #303133;
        letter-spacing: 1px;
      }
    }
    .el-form-item {
      margin-bottom: 28px;
      :deep(.el-form-item__content){
        width: 100%;
        margin-left: 0px;
      }
      .el-input{
        width: 100%;

        :deep(.el-input__wrapper){
          border-radius: 8px;
          height: 48px;
          padding: 0 16px;
          box-shadow: 0 0 0 1px #dcdfe6 inset;
          &:hover{
            box-shadow: 0 0 0 1px #c0c4cc inset;
          }
          &:focus-within{
            box-shadow: 0 0 0 1px #409eff inset;
          }
        }
      }
    }
    .el-button {
      width: 100%;
      height: 48;
      font-size: 16px;
      font-weight: 500;
      border-radius: 8px;
      letter-spacing: 2px;
      margin-top: 10px;
      box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
      transition: all 0.3s;
      &:hover{
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
      }
      &:active{
        transform: translateY(0);
      }
    }
  }
}
</style>
