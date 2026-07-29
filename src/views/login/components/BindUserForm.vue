<template>
  <div class="form-container">
    <div class="form-card">
      <div class="title"><h3>{{ $t("login.bind.title") }}</h3></div>
      <div class="content">
        <p class="tip">{{ $t("login.bind.tip") }}</p>
        <el-form
          ref="bindFormRef"
          :model="bindFormData"
          :rules="bindFormRules"
          @keyup.enter="handleBind"
        >
          <el-form-item prop="username">
            <el-input
              v-model.trim="bindFormData.username"
              :placeholder="$t('login.bind.form.username')"
              size="large"
            >
              <template #prefix><Icon icon="lucide:user" /></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model.trim="bindFormData.password"
              :type="bindPwdVisible ? 'text' : 'password'"
              :placeholder="$t('login.bind.form.password')"
              size="large"
            >
              <template #prefix><Icon icon="lucide:lock" /></template>
              <template #suffix>
                <Icon
                  :icon="bindPwdVisible ? 'lucide:eye' : 'lucide:eye-off'"
                  class="password-icon"
                  @click="bindPwdVisible = !bindPwdVisible"
                />
              </template>
            </el-input>
          </el-form-item>
          <el-button type="primary" size="large" :loading="bindLoading" @click.prevent="handleBind">
            {{ $t("login.bind.action") }}
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import type { FormRules } from 'element-plus'
import { socialUserBind } from '../apis'
import { useUserStore } from '@/pinia/stores/user'

const route = useRoute()
const router = useRouter()
const { t } = useI18n(); const $t = t
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
  username: [{ required: true, message: () => $t('login.bind.form.usernameRequired'), trigger: 'blur' }],
  password: [
    { required: true, message: () => $t('login.bind.form.passwordRequired'), trigger: 'blur' },
    { min: 8, max: 16, message: () => $t('login.bind.form.passwordLength'), trigger: 'blur' },
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
        ElMessage.success($t('login.bind.success'))
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
    .tip {
      margin: 0 0 var(--p-space-5);
      font-size: var(--p-text-sm);
      color: var(--theme-text-muted);
      text-align: center;
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
  }
}
</style>
