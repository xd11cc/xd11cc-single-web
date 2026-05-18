<template>
  <div class="form-container">
    <div class="form-card">
      <div class="title"><h3>用户注册</h3></div>
      <div class="content">
        <el-form ref="formRef" :model="formData" :rules="formRules" @keyup.enter="handleSubmit">
          <el-form-item prop="username">
            <el-input
              v-model.trim="formData.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              size="large"
              maxlength="20"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model.trim="formData.password"
              :type="pwdVisible ? 'text' : 'password'"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              size="large"
            >
              <template #suffix>
                <el-icon class="password-icon" @click="pwdVisible = !pwdVisible">
                  <View v-if="pwdVisible" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model.trim="formData.confirmPassword"
              :type="confirmPwdVisible ? 'text' : 'password'"
              placeholder="请确认密码"
              :prefix-icon="Lock"
              size="large"
            >
              <template #suffix>
                <el-icon class="password-icon" @click="confirmPwdVisible = !confirmPwdVisible">
                  <View v-if="confirmPwdVisible" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="phone">
            <el-input
              v-model.trim="formData.phone"
              placeholder="请输入手机号"
              :prefix-icon="Iphone"
              size="large"
              maxlength="11"
            />
          </el-form-item>
          <el-form-item prop="smsCode" class="code-form-item">
            <el-input
              v-model.trim="formData.smsCode"
              placeholder="请输入短信验证码"
              :prefix-icon="Message"
              size="large"
              maxlength="6"
            />
            <el-button :disabled="countdown > 0" class="code-btn" @click="handleSendSms">
              {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
            </el-button>
          </el-form-item>
          <el-form-item prop="email">
            <el-input
              v-model.trim="formData.email"
              placeholder="请输入邮箱"
              :prefix-icon="Message"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="captcha" class="code-form-item">
            <el-input
              v-model.trim="formData.captcha"
              placeholder="请输入图形验证码"
              :prefix-icon="Key"
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

          <el-button type="primary" size="large" :loading="loading" @click.prevent="handleSubmit">
            注 册
          </el-button>
          <div class="back-link">
            已有账号？<el-link type="primary" underline="never" @click="emit('back')">返回登录</el-link>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { User, Lock, Iphone, Message, Key, View, Hide } from '@element-plus/icons-vue'
import type { FormRules } from 'element-plus'
import { register, sendSmsCode, getCaptcha } from '@@/apis/auth'
import type { RegisterForm } from '@@/apis/auth.type'

const emit = defineEmits<{ back: [] }>()

const formRef = useTemplateRef('formRef')
const loading = ref(false)
const pwdVisible = ref(false)
const confirmPwdVisible = ref(false)
const captchaImg = ref('')
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const formData = reactive<RegisterForm>({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  smsCode: '',
  email: '',
  captcha: '',
  captchaId: '',
})

const phoneValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

const emailValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入邮箱'))
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error('请输入正确的邮箱地址'))
  } else {
    callback()
  }
}

const confirmPasswordValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请确认密码'))
  } else if (value !== formData.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在 4 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 16, message: '长度在 8 到 16 个字符', trigger: 'blur' },
  ],
  confirmPassword: [{ validator: confirmPasswordValidator, trigger: 'blur' }],
  phone: [{ validator: phoneValidator, trigger: 'blur' }],
  smsCode: [
    { required: true, message: '请输入短信验证码', trigger: 'blur' },
    { len: 6, message: '验证码为 6 位数字', trigger: 'blur' },
  ],
  email: [{ validator: emailValidator, trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入图形验证码', trigger: 'blur' }],
}

function startCountdown() {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer!)
      timer = null
    }
  }, 1000)
}

async function handleSendSms() {
  try { await formRef.value?.validateField('phone') } catch { return }
  try {
    await sendSmsCode(formData.phone)
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch {
    ElMessage.error('发送失败，请稍后重试')
  }
}

async function refreshCaptcha() {
  const res = await getCaptcha()
  formData.captchaId = res.data.captchaId
  captchaImg.value = 'data:image/png;base64,' + res.data.image
}

function handleSubmit() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return
    loading.value = true
    register(formData)
      .then(() => {
        ElMessage.success('注册成功，请登录')
        emit('back')
      })
      .catch(() => {
        refreshCaptcha()
        formData.captcha = ''
      })
      .finally(() => {
        loading.value = false
      })
  })
}

onMounted(() => {
  refreshCaptcha()
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.form-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;

  .form-card {
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
      height: 100px;
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
    padding: 10px 48px 40px;

    .code-form-item {
      :deep(.el-form-item__content) {
        display: flex;
        flex-wrap: nowrap;
        gap: 12px;
      }
    }

    .code-btn {
      flex-shrink: 0;
      min-width: 110px;
      border-radius: 8px;
      font-size: 13px;
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

    :deep(.el-input) {
      --el-input-focus-border-color: var(--business-border-focus);
      --el-input-hover-border-color: var(--business-border-focus);
    }

    :deep(.el-input__wrapper) {
      border-radius: 8px;
    }

    .password-icon {
      cursor: pointer;
      color: var(--business-text-placeholder);
      transition: color 0.2s;
      &:hover {
        color: var(--business-primary);
      }
    }

    :deep(.el-button--primary) {
      width: 100%;
      margin-top: 8px;
      font-weight: 500;
      letter-spacing: 1px;
      border-radius: 8px;
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

    :deep(.el-link--primary) {
      color: var(--business-primary);
      font-weight: 500;
      &:hover {
        color: var(--business-primary-hover);
      }
    }

    .back-link {
      text-align: center;
      margin-top: 18px;
      font-size: 14px;
      color: var(--business-text-secondary);
    }
  }
}

@media (max-width: 520px) {
  .form-container .form-card {
    width: 100%;
    max-width: 100%;
    border-radius: 0;
    border-top: 3px solid var(--business-primary);
  }

  .form-container .content {
    padding: 8px 24px 36px;
  }

  .form-container .captcha-img {
    width: 100px;
    height: 36px;
  }
}
</style>
