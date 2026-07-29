<template>
  <div class="form-container">
    <div class="form-card">
      <div class="title"><h3>{{ $t('login.forgot.title') }}</h3></div>
      <div class="content">
        <div class="login-tabs">
          <span :class="{ active: activeTab === 'phone' }" @click="activeTab = 'phone'">
            {{ $t('login.forgot.tabPhone') }}
          </span>
          <span :class="{ active: activeTab === 'email' }" @click="activeTab = 'email'">
            {{ $t('login.forgot.tabEmail') }}
          </span>
        </div>

        <el-form ref="formRef" :model="formData" :rules="formRules" @keyup.enter="handleSubmit">
          <!-- 手机找回 -->
          <template v-if="activeTab === 'phone'">
            <el-form-item prop="phone">
              <el-input
                v-model.trim="formData.phone"
                :placeholder="$t('login.forgot.phone')"
                size="large"
                maxlength="11"
              >
                <template #prefix><Icon icon="lucide:smartphone" /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="phoneCode" class="code-form-item">
              <el-input
                v-model.trim="formData.phoneCode"
                :placeholder="$t('login.forgot.phoneCode')"
                size="large"
                maxlength="6"
              >
                <template #prefix><Icon icon="lucide:mail" /></template>
              </el-input>
              <el-button :disabled="phoneCountdown > 0" class="code-btn" @click="handleSendSms">
                {{ phoneCountdown > 0 ? $t('login.forgot.resend', { n: phoneCountdown }) : $t('login.forgot.sendCode') }}
              </el-button>
            </el-form-item>
          </template>

          <!-- 邮箱找回 -->
          <template v-else>
            <el-form-item prop="email">
              <el-input
                v-model.trim="formData.email"
                :placeholder="$t('login.forgot.email')"
                size="large"
              >
                <template #prefix><Icon icon="lucide:mail" /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="emailCode" class="code-form-item">
              <el-input
                v-model.trim="formData.emailCode"
                :placeholder="$t('login.forgot.emailCode')"
                size="large"
                maxlength="6"
              >
                <template #prefix><Icon icon="lucide:key-round" /></template>
              </el-input>
              <el-button :disabled="emailCountdown > 0" class="code-btn" @click="handleSendEmail">
                {{ emailCountdown > 0 ? $t('login.forgot.resend', { n: emailCountdown }) : $t('login.forgot.sendCode') }}
              </el-button>
            </el-form-item>
          </template>

          <!-- 公共：新密码 -->
          <el-form-item prop="newPassword">
            <el-input
              v-model.trim="formData.newPassword"
              :type="pwdVisible ? 'text' : 'password'"
              :placeholder="$t('login.forgot.newPassword')"
              size="large"
            >
              <template #prefix><Icon icon="lucide:lock" /></template>
              <template #suffix>
                <Icon
                  :icon="pwdVisible ? 'lucide:eye' : 'lucide:eye-off'"
                  class="password-icon"
                  @click="pwdVisible = !pwdVisible"
                />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model.trim="formData.confirmPassword"
              :type="confirmPwdVisible ? 'text' : 'password'"
              :placeholder="$t('login.forgot.confirmPassword')"
              size="large"
            >
              <template #prefix><Icon icon="lucide:lock" /></template>
              <template #suffix>
                <Icon
                  :icon="confirmPwdVisible ? 'lucide:eye' : 'lucide:eye-off'"
                  class="password-icon"
                  @click="confirmPwdVisible = !confirmPwdVisible"
                />
              </template>
            </el-input>
          </el-form-item>

          <el-button type="primary" size="large" :loading="loading" @click.prevent="handleSubmit">
            {{ $t('login.forgot.submit') }}
          </el-button>
          <div class="back-link">
            {{ $t('login.forgot.backToLogin') }}<el-link type="primary" underline="never" @click="emit('back')"
              >{{ $t('login.forgot.backLink') }}</el-link
            >
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n"
import { Icon } from '@iconify/vue'
import type { FormRules } from 'element-plus'

const { t } = useI18n(); const $t = t

const emit = defineEmits<{ back: [] }>()

const formRef = useTemplateRef('formRef')
const loading = ref(false)
const activeTab = ref<'phone' | 'email'>('phone')
const pwdVisible = ref(false)
const confirmPwdVisible = ref(false)

const phoneCountdown = ref(0)
const emailCountdown = ref(0)
let phoneTimer: ReturnType<typeof setInterval> | null = null
let emailTimer: ReturnType<typeof setInterval> | null = null

const formData = reactive({
  phone: '',
  phoneCode: '',
  email: '',
  emailCode: '',
  newPassword: '',
  confirmPassword: '',
})

const confirmPasswordValidator = (
  _rule: unknown,
  value: string,
  callback: (error?: Error) => void,
) => {
  if (!value) {
    callback(new Error($t('login.forgot.confirmPassword')))
  } else if (value !== formData.newPassword) {
    callback(new Error($t('login.validation.passwordMismatch')))
  } else {
    callback()
  }
}

const phoneValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error($t('login.forgot.phone')))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error($t('login.forgot.phoneInvalid')))
  } else {
    callback()
  }
}

const emailValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error($t('login.forgot.email')))
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error($t('login.forgot.emailInvalid')))
  } else {
    callback()
  }
}

const formRules = computed<FormRules>(() => {
  if (activeTab.value === 'phone') {
    return {
      phone: [{ validator: phoneValidator, trigger: 'blur' }],
      phoneCode: [{ required: true, message: () => $t('login.rules.captchaRequired'), trigger: 'blur' }],
      newPassword: [
        { required: true, message: () => $t('login.forgot.newPassword'), trigger: 'blur' },
        { min: 8, max: 16, message: () => $t('login.validation.passwordLength'), trigger: 'blur' },
      ],
      confirmPassword: [{ validator: confirmPasswordValidator, trigger: 'blur' }],
    }
  }
  return {
    email: [{ validator: emailValidator, trigger: 'blur' }],
    emailCode: [{ required: true, message: () => $t('login.rules.captchaRequired'), trigger: 'blur' }],
    newPassword: [
      { required: true, message: () => $t('login.forgot.newPassword'), trigger: 'blur' },
      { min: 8, max: 16, message: () => $t('login.validation.passwordLength'), trigger: 'blur' },
    ],
    confirmPassword: [{ validator: confirmPasswordValidator, trigger: 'blur' }],
  }
})

function startCountdown(type: 'phone' | 'email') {
  const ref = type === 'phone' ? phoneCountdown : emailCountdown
  ref.value = 60
  const timer = setInterval(() => {
    ref.value--
    if (ref.value <= 0) clearInterval(timer)
  }, 1000)
  if (type === 'phone') phoneTimer = timer
  else emailTimer = timer
}

async function handleSendSms() {
  try {
    await formRef.value?.validateField('phone')
  } catch {
    return
  }
  try {
    // await sendSmsCode(formData.phone)
    ElMessage.success($t('login.forgot.smsSent'))
    startCountdown('phone')
  } catch {
    ElMessage.error($t('login.forgot.sendFail'))
  }
}

async function handleSendEmail() {
  try {
    await formRef.value?.validateField('email')
  } catch {
    return
  }
  try {
    // await sendEmailCode(formData.email)
    ElMessage.success($t('login.forgot.smsSent'))
    startCountdown('email')
  } catch {
    ElMessage.error($t('login.forgot.sendFail'))
  }
}

function handleSubmit() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return
    loading.value = true
    const data = {
      account: activeTab.value === 'phone' ? formData.phone : formData.email,
      code: activeTab.value === 'phone' ? formData.phoneCode : formData.emailCode,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    }
    // resetPassword(data)
    //   .then(() => {
    //     ElMessage.success('密码重置成功，请重新登录')
    //     emit('back')
    //   })
    //   .catch(() => {})
    //   .finally(() => {
    //     loading.value = false
    //   })
  })
}

watch(activeTab, () => {
  nextTick(() => {
    formRef.value?.clearValidate()
  })
})

onBeforeUnmount(() => {
  if (phoneTimer) clearInterval(phoneTimer)
  if (emailTimer) clearInterval(emailTimer)
})
</script>

<style lang="scss" scoped>
.form-container {
  width: 100%;

  .form-card {
    .title {
      text-align: center;
      margin-bottom: var(--p-space-6);

      h3 {
        margin: 0;
        font-family: var(--p-font-display);
        font-size: var(--p-text-lg);
        font-weight: var(--p-weight-semibold);
        color: var(--theme-text-primary);
      }
    }
  }

  .content {
    .login-tabs {
      display: flex;
      gap: var(--p-space-6);
      margin-bottom: var(--p-space-6);
      border-bottom: 1px solid var(--theme-border);

      span {
        position: relative;
        padding-bottom: 10px;
        font-size: var(--p-text-sm);
        font-weight: var(--p-weight-medium);
        color: var(--theme-text-muted);
        cursor: pointer;
        transition: color var(--p-duration-fast);
        user-select: none;

        &::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          border-radius: 1px;
          background-color: transparent;
          transition: background-color var(--p-duration-fast);
        }

        &.active {
          color: var(--theme-accent);
          font-weight: var(--p-weight-semibold);
          &::after {
            background-color: var(--theme-accent);
          }
        }

        &:hover:not(.active) {
          color: var(--theme-text-primary);
        }
      }
    }

    .code-form-item {
      :deep(.el-form-item__content) {
        display: flex;
        flex-wrap: nowrap;
        gap: 10px;
      }
    }

    .code-btn {
      flex-shrink: 0;
      min-width: 110px;
      border-radius: var(--input-radius);
      font-size: var(--p-text-xs);
      font-weight: var(--p-weight-medium);
      border: 1px solid var(--theme-border);
      background: var(--theme-bg-surface);
      color: var(--theme-text-secondary);
      transition: all var(--p-duration-fast) var(--p-ease-out);

      &:hover:not(:disabled) {
        border-color: var(--theme-accent);
        color: var(--theme-accent);
      }
    }

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

    .password-icon {
      cursor: pointer;
      color: var(--theme-text-muted);
      transition: color var(--p-duration-fast);
      &:hover {
        color: var(--theme-accent);
      }
    }

    :deep(.el-button--primary) {
      width: 100%;
      height: var(--btn-height);
      margin-top: var(--p-space-2);
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

    :deep(.el-link--primary) {
      color: var(--theme-accent);
      font-weight: var(--p-weight-medium);
      &:hover {
        color: var(--theme-accent-hover);
      }
    }

    .back-link {
      text-align: center;
      margin-top: 18px;
      font-size: var(--p-text-sm);
      color: var(--theme-text-muted);
    }
  }
}
</style>
