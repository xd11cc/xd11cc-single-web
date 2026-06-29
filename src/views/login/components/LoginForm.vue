<template>
  <div class="login-form">
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
          tabindex="1"
          size="large"
        >
          <template #prefix><Icon icon="lucide:user" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model.trim="loginFormData.password"
          :type="passwordVisible ? 'text' : 'password'"
          placeholder="请输入密码"
          tabindex="2"
          size="large"
        >
          <template #prefix><Icon icon="lucide:lock" /></template>
          <template #suffix>
            <Icon
              :icon="passwordVisible ? 'lucide:eye' : 'lucide:eye-off'"
              class="password-icon"
              @click="passwordVisible = !passwordVisible"
            />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="captcha">
        <div class="captcha-row">
          <el-input
            v-model.trim="loginFormData.captcha"
            placeholder="请输入验证码"
            type="text"
            tabindex="3"
            size="large"
          >
            <template #prefix><Icon icon="lucide:key-round" /></template>
          </el-input>
          <img
            :src="captchaImg"
            @click="refreshCaptcha"
            alt="验证码"
            title="点击刷新"
            class="captcha-img"
          />
        </div>
      </el-form-item>
      <el-form-item>
        <div class="form-options">
          <el-checkbox v-model="loginFormData.rememberMe">记住我</el-checkbox>
          <el-link type="primary" underline="never" @click="handleForgetPassword">
            忘记密码？
          </el-link>
        </div>
      </el-form-item>
      <el-button class="login-btn" size="large" @click.prevent="handleLogin" :loading="loading">
        登录
      </el-button>
    </el-form>

    <!-- 其他登录方式 -->
    <el-divider v-if="socialConfigs.length && ossUrl">其他登录方式</el-divider>
    <div v-if="socialConfigs.length && ossUrl" class="social-login">
      <div
        v-for="item in socialConfigs"
        :key="item.source"
        class="social-item"
        :title="item.name"
        @click="handleAuthLogin(item.source)"
      >
        <img :src="ossUrl + item.icon" :alt="item.name" class="social-icon" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/pinia/stores/user'
import { Icon } from '@iconify/vue'
import type { FormRules } from 'element-plus'
import type { LoginForm, AuthClientConfigVO } from '../apis/type'
import { getCaptcha, socialLogin, getSocialClientConfigList } from '../apis'
import { useOssUrl } from '@@/composables/useOssUrl'

const emit = defineEmits<{
  'forget-password': []
}>()

const useStore = useUserStore()

const router = useRouter()

const route = useRoute()

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

const captchaImg = ref('')
const loginFormRef = useTemplateRef('loginFormRef')
const loading = ref(false)
const passwordVisible = ref(false)
const socialConfigs = ref<AuthClientConfigVO[]>([])
const { ossUrl } = useOssUrl()

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

function handleAuthLogin(source: string) {
  socialLogin(source).then((res) => {
    window.location.href = res.data
  })
}

function handleForgetPassword() {
  emit('forget-password')
}

onMounted(() => {
  refreshCaptcha()
  getSocialClientConfigList().then((res) => {
    socialConfigs.value = res.data
  })
})
</script>

<style lang="scss" scoped>
.login-form {
  width: 100%;

  :deep(.el-input__wrapper) {
    border-radius: var(--input-radius);
    box-shadow: 0 0 0 1px var(--theme-border) inset;
    background: var(--theme-bg-elevated);
    transition: all var(--p-duration-fast) var(--p-ease-out);

    &:hover {
      box-shadow: 0 0 0 1px var(--theme-text-muted) inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1.5px var(--theme-accent) inset;
      background: var(--theme-bg-surface);
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  .captcha-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .captcha-img {
    width: 100px;
    height: 36px;
    border-radius: var(--input-radius);
    border: 1px solid var(--theme-border);
    cursor: pointer;
    flex-shrink: 0;
    object-fit: cover;
    transition: border-color var(--p-duration-fast);

    &:hover {
      border-color: var(--theme-text-muted);
    }
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-size: var(--p-text-sm);
  }

  .password-icon {
    cursor: pointer;
    color: var(--theme-text-muted);
    transition: color var(--p-duration-fast);

    &:hover {
      color: var(--theme-accent);
    }
  }

  .login-btn {
    width: 100%;
    height: var(--btn-height);
    border: none;
    border-radius: var(--btn-radius);
    font-family: var(--p-font-display);
    font-weight: var(--p-weight-semibold);
    font-size: var(--p-text-md);
    background: var(--theme-accent);
    color: #ffffff;
    transition: all var(--p-duration-fast) var(--p-ease-out);

    &:hover {
      background: var(--theme-accent-hover);
      box-shadow: 0 4px 12px var(--theme-accent-glow);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  :deep(.el-divider__text) {
    font-size: var(--p-text-xs);
    color: var(--theme-text-muted);
    background-color: var(--theme-bg-surface);
    padding: 0 10px;
  }

  .social-login {
    display: flex;
    justify-content: center;
    gap: 10px;

    .social-item {
      width: 34px;
      height: 34px;
      border-radius: var(--p-radius-md);
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      border: 1px solid var(--theme-border);
      background: var(--theme-bg-surface);
      transition: all var(--p-duration-fast) var(--p-ease-out);

      &:hover {
        border-color: var(--theme-accent);
        background: var(--theme-accent-light);
      }

      .social-icon {
        width: 16px;
        height: 16px;
        object-fit: contain;
      }
    }
  }
}
</style>
