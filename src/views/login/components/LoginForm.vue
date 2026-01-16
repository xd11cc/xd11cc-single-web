<template>
  <div class="login-container">
    <div class="login-card">
      <div class="title">
        <h3>用户登录</h3>
      </div>
      <div class="content">
        <el-form
          ref="loginFormRef"
          :model="loginFormData"
          :rules="loginFormRules"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model.trim="loginFormData.username"
              placeholder="请输入用户名"
              type="text"
              :prefix-icon="User"
              tabindex="1"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model.trim="loginFormData.password"
              placeholder="请输入密码"
              type="password"
              :prefix-icon="Lock"
              tabindex="2"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item prop="code">
            <el-input
              v-model.trim="loginFormData.code"
              placeholder="验证码"
              type="text"
              :prefix-icon="Key"
              tabindex="3"
              maxLength="7"
              size="large"
            >
            </el-input>
          </el-form-item>
          <el-button type="primary" size="large" @click.prevent="handleLogin" :loading="loading"
            >登录</el-button
          >
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/pinia/stores/user'
import { Key, Lock, User } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/pinia/stores/settings'
import type { FormRules } from 'element-plus'
import type { LoginForm } from '../apis/type'

const useStore = useUserStore()

const router = useRouter()

const route = useRoute()

const settingsStore = useSettingsStore()

// 登录参数
const loginFormData: LoginForm = reactive({
  username: '',
  password: '',
  way: 0,
  device: 0,
  app: 0,
  code: '',
})

// 登录表单元素的引用
const loginFormRef = useTemplateRef('loginFormRef')

// 登录按钮 Loading
const loading = ref(false)

// 登录表单校验规则
const loginFormRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 16, message: '长度在 8 到 16 个字符', trigger: 'blur' },
  ],
}

const handleLogin = () => {
  loginFormRef.value?.validate((valid: boolean) => {
    if (!valid) return
    loading.value = true
    useStore
      .userLogin(loginFormData)
      .then(() => {
        router.push(route.query.redirect ? decodeURIComponent(route.query.redirect as string) : '/')
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
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100%;
  .login-card {
    width: 480px;
    max-width: 90%;
    border-radius: 20px;
    box-shadow: 0 0 10px #dcdfe6;
    background-color: var(--el-bg-color);
    overflow: hidden;
    .title {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 150px;
    }
  }
  .content {
    padding: 20px 50px 50px 50px;
    :deep(.el-input-group__append) {
      padding: 0;
      overflow: hidden;
    }
    .el-button {
      width: 100%;
      margin-top: 10px;
    }
  }
}
</style>
