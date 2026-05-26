<template>
  <div class="profile-page">
    <!-- 顶部信息卡 -->
    <section class="profile-header" style="--delay: 0">
      <div class="avatar-section">
        <el-avatar :size="72" class="profile-avatar">
          <Icon icon="lucide:user" :width="32" :height="32" />
        </el-avatar>
        <div class="user-meta">
          <h2 class="user-name">{{ userStore.username || '用户' }}</h2>
          <div class="user-tags">
            <el-tag v-for="role in userStore.roles" :key="role" size="small" effect="plain">
              {{ role }}
            </el-tag>
          </div>
          <p class="user-join">加入时间：2024 年 3 月</p>
        </div>
      </div>
      <div class="header-stats">
        <div class="header-stat">
          <span class="header-stat-value">128</span>
          <span class="header-stat-label">操作次数</span>
        </div>
        <div class="header-stat">
          <span class="header-stat-value">36</span>
          <span class="header-stat-label">登录天数</span>
        </div>
        <div class="header-stat">
          <span class="header-stat-value">{{ userStore.permissions.length }}</span>
          <span class="header-stat-label">权限数</span>
        </div>
      </div>
    </section>

    <!-- Tab 内容 -->
    <section class="profile-content" style="--delay: 1">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="基本信息" name="info">
          <div class="info-grid">
            <div class="info-card">
              <h4 class="info-card-title">
                <Icon icon="lucide:user-circle" class="info-card-icon" />
                个人资料
              </h4>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">用户名</span>
                  <span class="info-value">{{ userStore.username }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">昵称</span>
                  <span class="info-value">{{ profileData.nickname }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">性别</span>
                  <span class="info-value">{{ profileData.sex }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">手机号</span>
                  <span class="info-value">{{ profileData.phone }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">邮箱</span>
                  <span class="info-value">{{ profileData.email }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">部门</span>
                  <span class="info-value">{{ profileData.dept }}</span>
                </div>
              </div>
            </div>

            <div class="info-card">
              <h4 class="info-card-title">
                <Icon icon="lucide:shield-check" class="info-card-icon" />
                角色与权限
              </h4>
              <div class="role-section">
                <div class="role-list">
                  <div v-for="role in userStore.roles" :key="role" class="role-item">
                    <Icon icon="lucide:badge-check" class="role-icon" />
                    <span>{{ role }}</span>
                  </div>
                </div>
                <el-divider />
                <div class="permission-summary">
                  <p>共拥有 <strong>{{ userStore.permissions.length }}</strong> 项操作权限</p>
                  <div class="permission-tags">
                    <el-tag
                      v-for="perm in displayPermissions"
                      :key="perm"
                      size="small"
                      type="info"
                      effect="plain"
                    >
                      {{ perm }}
                    </el-tag>
                    <el-tag v-if="userStore.permissions.length > 8" size="small" type="info" effect="plain">
                      +{{ userStore.permissions.length - 8 }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="修改资料" name="edit">
          <div class="edit-card">
            <el-form
              ref="editFormRef"
              :model="editForm"
              :rules="editRules"
              label-width="80px"
              label-position="left"
              class="edit-form"
            >
              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="editForm.phone" placeholder="请输入手机号" maxlength="11" />
              </el-form-item>
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="editForm.email" placeholder="请输入邮箱" />
              </el-form-item>
              <el-form-item label="性别" prop="sex">
                <el-radio-group v-model="editForm.sex">
                  <el-radio value="男">男</el-radio>
                  <el-radio value="女">女</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSaveProfile">保存修改</el-button>
                <el-button @click="resetEditForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="password">
          <div class="edit-card">
            <el-form
              ref="pwdFormRef"
              :model="pwdForm"
              :rules="pwdRules"
              label-width="100px"
              label-position="left"
              class="edit-form"
            >
              <el-form-item label="当前密码" prop="oldPassword">
                <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="请输入新密码" />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请确认新密码" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleChangePassword">确认修改</el-button>
                <el-button @click="resetPwdForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="操作日志" name="log">
          <div class="log-card">
            <div class="log-timeline">
              <div v-for="log in operationLogs" :key="log.id" class="log-item">
                <div class="log-dot" :style="{ background: log.color }"></div>
                <div class="log-content">
                  <p class="log-text">{{ log.action }}</p>
                  <div class="log-meta">
                    <span class="log-time">{{ log.time }}</span>
                    <span class="log-ip">{{ log.ip }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/pinia/stores/user'
import type { FormRules } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()

const activeTab = ref((route.params.activeTab as string) || 'info')

const profileData = reactive({
  nickname: '管理员',
  sex: '男',
  phone: '138****8888',
  email: 'admin@example.com',
  dept: '技术部',
})

const displayPermissions = computed(() => userStore.permissions.slice(0, 8))

// 修改资料
const editFormRef = useTemplateRef('editFormRef')
const editForm = reactive({
  nickname: profileData.nickname,
  phone: '13800008888',
  email: profileData.email,
  sex: profileData.sex,
})

const editRules: FormRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱', trigger: 'blur' },
  ],
}

function handleSaveProfile() {
  editFormRef.value?.validate((valid: boolean) => {
    if (!valid) return
    ElMessage.success('资料修改成功')
  })
}

function resetEditForm() {
  editFormRef.value?.resetFields()
}

// 修改密码
const pwdFormRef = useTemplateRef('pwdFormRef')
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 16, message: '长度在 8 到 16 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_r: unknown, value: string, cb: (e?: Error) => void) => {
        if (value && value !== pwdForm.newPassword) cb(new Error('两次输入密码不一致'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

function handleChangePassword() {
  pwdFormRef.value?.validate((valid: boolean) => {
    if (!valid) return
    ElMessage.success('密码修改成功')
    resetPwdForm()
  })
}

function resetPwdForm() {
  pwdFormRef.value?.resetFields()
}

// 操作日志
const operationLogs = [
  { id: 1, action: '登录系统', time: '2024-03-15 09:12:34', ip: '192.168.1.100', color: 'var(--theme-accent)' },
  { id: 2, action: '修改个人资料', time: '2024-03-14 16:45:12', ip: '192.168.1.100', color: 'var(--theme-info)' },
  { id: 3, action: '导出用户列表', time: '2024-03-14 14:22:08', ip: '192.168.1.100', color: 'var(--theme-warning)' },
  { id: 4, action: '修改密码', time: '2024-03-13 11:08:56', ip: '192.168.1.101', color: 'var(--theme-success)' },
  { id: 5, action: '新增角色「运营」', time: '2024-03-12 10:30:22', ip: '192.168.1.100', color: 'var(--theme-accent)' },
  { id: 6, action: '删除菜单「临时页面」', time: '2024-03-11 09:15:44', ip: '192.168.1.100', color: 'var(--theme-danger)' },
  { id: 7, action: '登录系统', time: '2024-03-11 09:02:10', ip: '192.168.1.102', color: 'var(--theme-accent)' },
]
</script>

<style lang="scss" scoped>
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-header,
.profile-content {
  animation: fade-up 0.5s var(--p-ease-out) both;
  animation-delay: calc(var(--delay, 0) * 100ms);
}

.profile-page {
  padding: var(--p-space-6);
  max-width: 960px;
  margin: 0 auto;
}

// 顶部卡片
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);
  margin-bottom: var(--p-space-5);
  gap: var(--p-space-5);
  flex-wrap: wrap;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: var(--p-space-4);
}

.profile-avatar {
  background: var(--theme-accent-light);
  color: var(--theme-accent);
  flex-shrink: 0;
}

.user-meta {
  .user-name {
    margin: 0 0 var(--p-space-1);
    font-family: var(--p-font-display);
    font-size: var(--p-text-xl);
    font-weight: var(--p-weight-bold);
    color: var(--theme-text-primary);
  }

  .user-tags {
    display: flex;
    gap: 6px;
    margin-bottom: var(--p-space-1);
  }

  .user-join {
    margin: 0;
    font-size: var(--p-text-xs);
    color: var(--theme-text-muted);
  }
}

.header-stats {
  display: flex;
  gap: var(--p-space-6);
}

.header-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  .header-stat-value {
    font-family: var(--p-font-display);
    font-size: var(--p-text-xl);
    font-weight: var(--p-weight-bold);
    color: var(--theme-text-primary);
  }

  .header-stat-label {
    font-size: var(--p-text-xs);
    color: var(--theme-text-muted);
  }
}

// Tabs
.profile-content {
  :deep(.el-tabs__header) {
    margin-bottom: var(--p-space-5);
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background: var(--theme-border);
  }

  :deep(.el-tabs__active-bar) {
    background: var(--theme-accent);
  }

  :deep(.el-tabs__item) {
    font-weight: var(--p-weight-medium);
    color: var(--theme-text-muted);

    &.is-active {
      color: var(--theme-accent);
    }

    &:hover {
      color: var(--theme-text-primary);
    }
  }
}

// 基本信息
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--p-space-4);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.info-card {
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);

  .info-card-title {
    margin: 0 0 var(--p-space-4);
    font-family: var(--p-font-display);
    font-size: var(--p-text-md);
    font-weight: var(--p-weight-semibold);
    color: var(--theme-text-primary);
    display: flex;
    align-items: center;
    gap: var(--p-space-2);
  }

  .info-card-icon {
    font-size: 18px;
    color: var(--theme-accent);
  }
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-3);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--theme-border);

  &:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: var(--p-text-sm);
    color: var(--theme-text-muted);
  }

  .info-value {
    font-size: var(--p-text-sm);
    color: var(--theme-text-primary);
    font-weight: var(--p-weight-medium);
  }
}

.role-section {
  .role-list {
    display: flex;
    flex-direction: column;
    gap: var(--p-space-2);
  }

  .role-item {
    display: flex;
    align-items: center;
    gap: var(--p-space-2);
    font-size: var(--p-text-sm);
    color: var(--theme-text-primary);

    .role-icon {
      font-size: 16px;
      color: var(--theme-accent);
    }
  }

  .permission-summary {
    p {
      margin: 0 0 var(--p-space-3);
      font-size: var(--p-text-sm);
      color: var(--theme-text-muted);

      strong {
        color: var(--theme-accent);
      }
    }
  }

  .permission-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

// 编辑表单
.edit-card {
  max-width: 500px;
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);
}

.edit-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
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

  :deep(.el-button--primary) {
    border: none;
    border-radius: var(--btn-radius);
    font-family: var(--p-font-display);
    font-weight: var(--p-weight-semibold);
    background: var(--theme-accent);
    color: #ffffff;
    transition: all var(--p-duration-fast) var(--p-ease-out);

    &:hover {
      background: var(--theme-accent-hover);
      box-shadow: 0 4px 12px var(--theme-accent-glow);
    }
  }

  :deep(.el-button--default) {
    border-radius: var(--btn-radius);
    border: 1px solid var(--theme-border);
    background: var(--theme-bg-surface);
    color: var(--theme-text-secondary);

    &:hover {
      border-color: var(--theme-accent);
      color: var(--theme-accent);
    }
  }
}

// 操作日志
.log-card {
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);
}

.log-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  padding-left: 20px;

  &::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 8px;
    bottom: 8px;
    width: 1px;
    background: var(--theme-border);
  }
}

.log-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--p-space-3);
  padding: 12px 0;

  .log-dot {
    position: absolute;
    left: -20px;
    top: 18px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    z-index: 1;
    box-shadow: 0 0 0 3px var(--theme-bg-surface);
  }

  .log-content {
    flex: 1;

    .log-text {
      margin: 0 0 4px;
      font-size: var(--p-text-sm);
      color: var(--theme-text-primary);
      font-weight: var(--p-weight-medium);
    }

    .log-meta {
      display: flex;
      gap: var(--p-space-3);
      font-size: var(--p-text-xs);
      color: var(--theme-text-muted);
    }
  }
}

@media (max-width: 768px) {
  .profile-page {
    padding: var(--p-space-4);
  }

  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-stats {
    width: 100%;
    justify-content: space-around;
  }
}
</style>
