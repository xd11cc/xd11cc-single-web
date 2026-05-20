<template>
  <div class="form-container">
    <div class="form-card">
      <div class="title"><h3>找回密码</h3></div>
      <div class="content">
        <div class="login-tabs">
          <span :class="{ active: activeTab === 'phone' }" @click="activeTab = 'phone'">
            手机找回
          </span>
          <span :class="{ active: activeTab === 'email' }" @click="activeTab = 'email'">
            邮箱找回
          </span>
        </div>

        <el-form ref="formRef" :model="formData" :rules="formRules" @keyup.enter="handleSubmit">
          <!-- 手机找回 -->
          <template v-if="activeTab === 'phone'">
            <el-form-item prop="phone">
              <el-input
                v-model.trim="formData.phone"
                placeholder="请输入手机号"
                :prefix-icon="Iphone"
                size="large"
                maxlength="11"
              />
            </el-form-item>
            <el-form-item prop="phoneCode" class="code-form-item">
              <el-input
                v-model.trim="formData.phoneCode"
                placeholder="请输入验证码"
                :prefix-icon="Message"
                size="large"
                maxlength="6"
              />
              <el-button :disabled="phoneCountdown > 0" class="code-btn" @click="handleSendSms">
                {{ phoneCountdown > 0 ? `${phoneCountdown}s 后重发` : '获取验证码' }}
              </el-button>
            </el-form-item>
          </template>

          <!-- 邮箱找回 -->
          <template v-else>
            <el-form-item prop="email">
              <el-input
                v-model.trim="formData.email"
                placeholder="请输入邮箱"
                :prefix-icon="Message"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="emailCode" class="code-form-item">
              <el-input
                v-model.trim="formData.emailCode"
                placeholder="请输入验证码"
                :prefix-icon="Key"
                size="large"
                maxlength="6"
              />
              <el-button :disabled="emailCountdown > 0" class="code-btn" @click="handleSendEmail">
                {{ emailCountdown > 0 ? `${emailCountdown}s 后重发` : '获取验证码' }}
              </el-button>
            </el-form-item>
          </template>

          <!-- 公共：新密码 -->
          <el-form-item prop="newPassword">
            <el-input
              v-model.trim="formData.newPassword"
              :type="pwdVisible ? 'text' : 'password'"
              placeholder="请输入新密码"
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
              placeholder="请确认新密码"
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

          <el-button type="primary" size="large" :loading="loading" @click.prevent="handleSubmit">
            重置密码
          </el-button>
          <div class="back-link">
            想起密码了？<el-link type="primary" underline="never" @click="emit('back')"
              >返回登录</el-link
            >
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Iphone, Message, Lock, Key, View, Hide } from '@element-plus/icons-vue'
import type { FormRules } from 'element-plus'

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
    callback(new Error('请确认新密码'))
  } else if (value !== formData.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

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

const formRules = computed<FormRules>(() => {
  if (activeTab.value === 'phone') {
    return {
      phone: [{ validator: phoneValidator, trigger: 'blur' }],
      phoneCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 8, max: 16, message: '长度在 8 到 16 个字符', trigger: 'blur' },
      ],
      confirmPassword: [{ validator: confirmPasswordValidator, trigger: 'blur' }],
    }
  }
  return {
    email: [{ validator: emailValidator, trigger: 'blur' }],
    emailCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 8, max: 16, message: '长度在 8 到 16 个字符', trigger: 'blur' },
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
    ElMessage.success('验证码已发送')
    startCountdown('phone')
  } catch {
    ElMessage.error('发送失败，请稍后重试')
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
    ElMessage.success('验证码已发送')
    startCountdown('email')
  } catch {
    ElMessage.error('发送失败，请稍后重试')
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
      height: 120px;
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
    padding: 10px 48px 48px;

    .login-tabs {
      display: flex;
      gap: 28px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--business-border);

      span {
        position: relative;
        padding-bottom: 10px;
        font-size: 15px;
        color: var(--business-text-secondary);
        cursor: pointer;
        transition: color 0.25s;
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
          transition: background-color 0.25s;
        }

        &.active {
          color: var(--business-primary);
          font-weight: 600;
          &::after {
            background-color: var(--business-primary);
          }
        }

        &:hover:not(.active) {
          color: var(--business-text);
        }
      }
    }

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
}
</style>
