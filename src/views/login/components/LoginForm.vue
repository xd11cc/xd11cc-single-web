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
          <el-form-item prop="captcha" class="captcha-form-item">
            <el-input
              v-model.trim="loginFormData.captcha"
              placeholder="请输入验证码"
              type="text"
              :prefix-icon="Lock"
              tabindex="3"
              size="large"
            />
            <img
              :src="captchaImg"
              @click="refreshCaptcha"
              alt="验证码"
              title="点击刷新"
              class="captcha-img"
            />
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
import { Lock, User } from '@element-plus/icons-vue'
import type { FormRules } from 'element-plus'
import type { LoginForm } from '../apis/type'
import { getCaptcha } from '../apis'

const useStore = useUserStore()

const router = useRouter()

const route = useRoute()

// 登录参数
const loginFormData: LoginForm = reactive({
  username: '',
  password: '',
  way: 0,
  device: 0,
  app: 0,
  captcha: '',
  captchaId: '',
})

// 验证码
const captchaImg = ref('')

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
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
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
        refreshCaptcha()
        loginFormData.captcha = ''
      })
      .finally(() => {
        loading.value = false
      })
  })
}

const refreshCaptcha = async () => {
  const res = await getCaptcha()
  loginFormData.captchaId = res.data.captchaId
  captchaImg.value = 'data:image/png;base64,' + res.data.image
}

onMounted(() => {
  refreshCaptcha()
})
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

    .captcha-form-item {
      display: flex;
      align-items: center;
    }

    :deep(.el-form-item__content) {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
    }

    :deep(.el-input) {
      float: 1;
      margin-right: 12px;
    }
  }

  .captcha-img {
    width: 120px;
    height: 40px;
    border-radius: 6px;
    border: 1px solid #dcdfe6;
    cursor: pointer;
    box-sizing: border-box;
    transition: all 0.3s;
    user-select: none;
    flex-shrink: 0;

    &:hover {
      border-color: #c0c4cc;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
    }

    &:active {
      transform: scale(0.98);
    }
  }
}
</style>
