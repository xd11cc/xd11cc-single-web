<template>
  <div class="form-container">
    <div class="form-card">
      <div class="title"><h3>社交账号绑定</h3></div>
      <div class="content">
        <p class="tip">请绑定已有账号以完成第三方登录</p>
        <el-form
          ref="bindFormRef"
          :model="bindFormData"
          :rules="bindFormRules"
          @keyup.enter="handleBind"
        >
          <el-form-item prop="username">
            <el-input
              v-model.trim="bindFormData.username"
              placeholder="请输入用户名"
              size="large"
            >
              <template #prefix><Icon icon="ep:user" /></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model.trim="bindFormData.password"
              :type="bindPwdVisible ? 'text' : 'password'"
              placeholder="请输入密码"
              size="large"
            >
              <template #prefix><Icon icon="ep:lock" /></template>
              <template #suffix>
                <Icon
                  :icon="bindPwdVisible ? 'ep:view' : 'ep:hide'"
                  class="password-icon"
                  @click="bindPwdVisible = !bindPwdVisible"
                />
              </template>
            </el-input>
          </el-form-item>
          <el-button type="primary" size="large" :loading="bindLoading" @click.prevent="handleBind">
            关联登录
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import type { FormRules } from 'element-plus'
import { socialUserBind } from '../apis'
import { useUserStore } from '@/pinia/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const source = computed(() => (route.query.source as string) || '')
const state = computed(() => (route.query.state as string) || '')

const bindFormRef = useTemplateRef('bindFormRef')
const bindLoading = ref(false)
const bindPwdVisible = ref(false)

const bindFormData = reactive({
  username: '',
  password: '',
})

const bindFormRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 16, message: '长度在 8 到 16 个字符', trigger: 'blur' },
  ],
}

function handleBind() {
  bindFormRef.value?.validate((valid: boolean) => {
    if (!valid) return
    bindLoading.value = true
    socialUserBind({
      username: bindFormData.username,
      password: bindFormData.password,
      source: source.value,
      state: state.value,
      way: 0,
      device: 0,
      app: 0,
    })
      .then(({ data }) => {
        userStore.setToken(data)
        router.push('/')
        ElMessage.success('关联成功')
      })
      .catch(() => {})
      .finally(() => {
        bindLoading.value = false
      })
  })
}
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

    .tip {
      margin: 0 0 20px;
      font-size: 14px;
      color: var(--business-text-secondary);
      text-align: center;
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
