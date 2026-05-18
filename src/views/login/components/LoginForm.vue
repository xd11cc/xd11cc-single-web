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
              :prefix-icon="Key"
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
          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="loginFormData.rememberMe">记住我</el-checkbox>
              <el-link type="primary" underline="never" @click="handleForgetPassword"
                >忘记密码？</el-link
              >
            </div>
          </el-form-item>
          <el-button type="primary" size="large" @click.prevent="handleLogin" :loading="loading"
            >登录</el-button
          >
          <div class="register-link">
            还没有账号？<el-link type="primary" underline="never" @click="handleRegister"
              >立即注册</el-link
            >
          </div>
          <el-divider>其他登录方式</el-divider>
          <!-- 优化后的第三方登录图标容器 -->
          <div class="social-login">
            <div
              class="social-item github"
              @click="handleAuthLogin(SourceEnum.github)"
              title="GitHub登录"
            >
              <SvgIcon name="github" />
            </div>
            <a href="/xd11cc/login/authorize/GITHUB">
              <div class="social-item wechat" title="微信登录">
                <SvgIcon name="wechat" />
              </div>
            </a>
            <div class="social-item qq" @click="handleAuthLogin(SourceEnum.qq)" title="QQ登录">
              <SvgIcon name="qq" />
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/pinia/stores/user'
import { Lock, User, Key } from '@element-plus/icons-vue'
import type { FormRules } from 'element-plus'
import type { LoginForm } from '../apis/type'
import { SourceEnum } from '../apis/type'
import { getCaptcha, socialLogin } from '../apis'

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
  rememberMe: false,
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

/**
 * 处理授权登录
 * @param source
 */
function handleAuthLogin(source: string) {
  socialLogin(source).then((res) => {
    window.location.href = res.data
  })
}

function handleForgetPassword() {}

function handleRegister() {}

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
  min-height: 100vh;
  background-color: var(--business-bg);
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 40px,
      rgba(0, 0, 0, 0.012) 40px,
      rgba(0, 0, 0, 0.012) 41px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 40px,
      rgba(0, 0, 0, 0.012) 40px,
      rgba(0, 0, 0, 0.012) 41px
    );
  position: relative;

  &::after {
    content: '';
    position: fixed;
    bottom: -120px;
    right: -80px;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(26, 54, 93, 0.04) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .login-card {
    position: relative;
    z-index: 1;
    width: 460px;
    max-width: 92%;
    border-radius: 12px;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.04),
      0 6px 24px rgba(0, 0, 0, 0.06),
      0 12px 40px rgba(0, 0, 0, 0.04);
    background-color: var(--business-card-bg);
    overflow: hidden;
    border-top: 4px solid var(--business-primary);

    .title {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 120px;
      position: relative;
      background: linear-gradient(
        180deg,
        rgba(26, 54, 93, 0.03) 0%,
        rgba(26, 54, 93, 0.005) 60%,
        transparent 100%
      );

      h3 {
        margin: 0;
        font-size: 26px;
        font-weight: 600;
        letter-spacing: 2px;
        color: var(--business-text);
        position: relative;

        &::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 3px;
          border-radius: 2px;
          background-color: var(--business-primary);
        }
      }
    }
  }

  .content {
    padding: 10px 48px 48px 48px;

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      font-size: 13px;
    }

    .el-button {
      width: 100%;
      margin-top: 8px;
      font-weight: 500;
      letter-spacing: 1px;
      border-radius: 8px;
      transition: all 0.25s ease;
    }

    :deep(.el-button--primary) {
      background-color: var(--business-primary);
      border-color: var(--business-primary);

      &:hover,
      &:focus {
        background-color: var(--business-primary-hover);
        border-color: var(--business-primary-hover);
        box-shadow: 0 4px 14px rgba(26, 54, 93, 0.3);
      }

      &:active {
        background-color: var(--business-primary-active);
        border-color: var(--business-primary-active);
      }
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
      flex: 1;
      margin-right: 14px;
    }

    :deep(.el-input__wrapper) {
      border-radius: 8px;
      transition:
        box-shadow 0.25s ease,
        border-color 0.25s ease;

      &.is-focus {
        box-shadow: 0 0 0 1px var(--business-border-focus) inset;
      }
    }

    :deep(.el-checkbox__inner) {
      border-radius: 4px;
    }

    :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
      background-color: var(--business-primary);
      border-color: var(--business-primary);
    }

    :deep(.el-link--primary) {
      color: var(--business-primary);
      font-weight: 500;

      &:hover {
        color: var(--business-primary-hover);
      }
    }

    .register-link {
      text-align: center;
      margin-top: 18px;
      font-size: 14px;
      color: var(--business-text-secondary);
    }

    :deep(.el-divider) {
      margin: 22px 0 16px 0;
    }

    :deep(.el-divider__text) {
      font-size: 13px;
      color: var(--business-text-placeholder);
      letter-spacing: 0.5px;
      background-color: var(--business-card-bg);
      padding: 0 16px;
      font-weight: 400;
    }
  }

  .captcha-img {
    width: 120px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid var(--business-border);
    cursor: pointer;
    box-sizing: border-box;
    transition: all 0.25s ease;
    user-select: none;
    flex-shrink: 0;
    object-fit: cover;

    &:hover {
      border-color: var(--business-primary);
      box-shadow: 0 0 0 3px rgba(26, 54, 93, 0.06);
    }

    &:active {
      transform: scale(0.97);
    }
  }

  .social-login {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-top: 8px;

    .social-item {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1.2);
      border: 1px solid var(--business-border);
      background-color: #fafbfc;
      color: #555;
      user-select: none;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      }

      &:active {
        transform: translateY(0) scale(0.95);
        transition-duration: 0.1s;
      }

      &.github:hover {
        background-color: #24292e;
        color: #fff;
        border-color: #24292e;
      }

      &.wechat:hover {
        background-color: #07c160;
        color: #fff;
        border-color: #07c160;
      }

      &.qq:hover {
        background-color: #12b7f5;
        color: #fff;
        border-color: #12b7f5;
      }

      :deep(.svg-icon) {
        width: 22px;
        height: 22px;
      }
    }
  }
}

@media (max-width: 520px) {
  .login-container {
    .login-card {
      width: 100%;
      max-width: 100%;
      border-radius: 0;
      border-top: 3px solid var(--business-primary);
    }

    .content {
      padding: 8px 24px 36px 24px;
    }

    .captcha-img {
      width: 100px;
      height: 36px;
    }

    .social-login {
      gap: 16px;

      .social-item {
        width: 38px;
        height: 38px;

        :deep(.svg-icon) {
          width: 20px;
          height: 20px;
        }
      }
    }
  }
}
</style>
