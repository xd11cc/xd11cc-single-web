<template>
  <div class="login-container">
    <el-form ref="loginRef" :model="loginData.loginForm" :rules="loginRules">
      <div class="title-container">
        <h3 class="title">用户登录</h3>
      </div>
      <el-form-item prop="username">
        <el-input
          v-model.trim="loginData.loginForm.username"
          placeholder="请输入用户名"
          name="username"
          type="text"
        >
          <template #prefix>
            <SvgIcon name="zhanghu-yonghuguanli" class="el-input__icon" />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model.trim="loginData.loginForm.password"
          @keyup.enter="login"
          placeholder="请输入密码"
          name="password"
          :type="passwordData.passwordType"
        >
          <template #prefix>
            <SvgIcon name="mima" class="el-input__icon" />
          </template>
          <template #suffix>
            <SvgIcon
              :name="passwordData.eyeStatus"
              class="el-input__icon-eye"
              @click="showPassword"
            />
          </template>
        </el-input>
      </el-form-item>
      <el-button type="primary" @click="login" :loading="loading">登录</el-button>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

let useStore = useUserStore()

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
  const reg = /^(?=.*\d)(?=.*[a-zA-Z])[\x20-\x7E]{8,20}$/
  if (!reg.test(value)) {
    callback(new Error('密码必须包含字母和数字，且不能少于8位'))
  } else {
    callback()
  }
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

const loginRef = ref(null)
const loading = ref(false)

const login = () => {
  loginRef.value.validate((valid) => {
    if (!valid) return
    loading.value = true
    useStore
      .userLogin(loginData.loginForm)
      .then(() => {
        ElMessage.success('登录成功')
      })
      .catch(() => {
        ElMessage.error('登录失败')
      })
    loading.value = false
  })
}

const passwordData = reactive({
  passwordVisible: false,
  eyeStatus: 'eye-close',
  passwordType: 'password',
})

const showPassword = () => {
  passwordData.passwordVisible = !passwordData.passwordVisible
  passwordData.eyeStatus = passwordData.passwordVisible ? 'eye' : 'eye-close'
  passwordData.passwordType = passwordData.passwordVisible ? 'text' : 'password'
}
</script>

<style lang="scss" scoped>
.el-form {
  width: 460px;
  padding: 40px;
  box-sizing: border-box;
  .title-container {
    text-align: center;
    .title {
      font-size: 28px;
      letter-spacing: 10px;
      padding: 28px;
    }
  }
  .el-form-item {
    margin-bottom: 16px;
    padding: 8px;
    &:deep(.el-form-item__content) {
      margin-left: -8px !important; // 增加权重
    }
    .el-input {
      width: 100%;
      .el-input__icon-eye {
        cursor: pointer;
      }
    }
  }
  .el-button {
    width: 100%;
    height: 100%;
    font-size: 18px;
    font-weight: 500;
    border-radius: 8px;
    letter-spacing: 10px;
    margin-top: 10px;
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
    transition: all 0.3s;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
    }
    &:active {
      transform: translateY(0);
    }
  }
}
</style>
