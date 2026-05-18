<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" @keyup.enter="handleLogin">
    <el-form-item prop="phone">
      <el-input
        v-model.trim="formData.phone"
        placeholder="请输入手机号"
        type="text"
        :prefix-icon="Iphone"
        tabindex="1"
        size="large"
        maxlength="11"
      />
    </el-form-item>
    <el-form-item prop="smsCode" class="sms-form-item">
      <el-input
        v-model.trim="formData.smsCode"
        placeholder="请输入验证码"
        type="text"
        :prefix-icon="Message"
        tabindex="2"
        size="large"
        maxlength="6"
      />
      <el-button
        :disabled="countdown > 0"
        class="sms-btn"
        @click="handleSendCode"
      >
        {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
      </el-button>
    </el-form-item>
    <el-form-item>
      <el-checkbox v-model="formData.rememberMe">记住我</el-checkbox>
    </el-form-item>
    <el-button type="primary" size="large" :loading="loading" @click.prevent="handleLogin">
      登录
    </el-button>
    <div class="register-link">
      还没有账号？<el-link type="primary" underline="never" @click="emit('register')">立即注册</el-link>
    </div>
  </el-form>
</template>

<script lang="ts" setup>
import { Iphone, Message } from '@element-plus/icons-vue'

const emit = defineEmits<{ register: [] }>()
import type { FormRules } from 'element-plus'
import { useUserStore } from '@/pinia/stores/user'
import { sendSmsCode, loginByPhone } from '@@/apis/auth'
import type { PhoneSmsLoginForm } from '@@/apis/auth.type'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const formRef = useTemplateRef('formRef')
const loading = ref(false)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const formData = reactive<PhoneSmsLoginForm>({
  phone: '',
  smsCode: '',
  way: 1,
  device: 0,
  app: 0,
  rememberMe: false,
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

const formRules: FormRules = {
  phone: [{ validator: phoneValidator, trigger: 'blur' }],
  smsCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为 6 位数字', trigger: 'blur' },
  ],
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

async function handleSendCode() {
  try {
    await formRef.value?.validateField('phone')
  } catch {
    return
  }
  try {
    await sendSmsCode(formData.phone)
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch {
    ElMessage.error('验证码发送失败，请稍后重试')
  }
}

function handleLogin() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return
    loading.value = true
    loginByPhone(formData)
      .then(({ data }) => {
        userStore.setToken(data)
        router.push(
          route.query.redirect ? decodeURIComponent(route.query.redirect as string) : '/',
        )
        ElMessage.success('登录成功')
      })
      .catch(() => {
        formData.smsCode = ''
      })
      .finally(() => {
        loading.value = false
      })
  })
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.sms-form-item {
  :deep(.el-form-item__content) {
    display: flex;
    flex-wrap: nowrap;
    gap: 12px;
  }
}

.sms-btn {
  flex-shrink: 0;
  min-width: 110px;
  border-radius: 8px;
  font-size: 13px;
}

:deep(.el-button--primary) {
  width: 100%;
  margin-top: 8px;
  font-weight: 500;
  letter-spacing: 1px;
  border-radius: 8px;
}

.register-link {
  text-align: center;
  margin-top: 18px;
  font-size: 14px;
  color: var(--business-text-secondary);
}
</style>
