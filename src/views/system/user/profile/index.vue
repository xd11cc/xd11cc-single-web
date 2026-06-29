<template>
  <div class="profile-page">
    <!-- 左侧用户卡片 -->
    <aside class="profile-sidebar">
      <div class="user-card">
        <div class="avatar-wrapper" @click="handleAvatarClick">
          <el-avatar :size="80" :src="avatarUrl" class="user-avatar">
            <span class="avatar-text">{{ avatarFallback }}</span>
          </el-avatar>
          <div class="avatar-overlay">
            <Icon icon="lucide:camera" :width="20" :height="20" />
          </div>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/png,image/jpeg,image/gif"
          style="display: none"
          @change="handleFileChange"
        />
        <h2 class="user-name">{{ userStore.nickname || userStore.username || '用户' }}</h2>
        <div class="user-tags">
          <el-tag v-for="name in displayRoles" :key="name" size="small" effect="plain">
            {{ name }}
          </el-tag>
        </div>
      </div>

      <div class="sidebar-card">
        <h4 class="sidebar-title">基本信息</h4>
        <div class="sidebar-list">
          <div class="sidebar-item">
            <Icon icon="lucide:user" class="sidebar-icon" />
            <span class="sidebar-label">用户名</span>
            <span class="sidebar-value">{{ userStore.username || '-' }}</span>
          </div>
          <div class="sidebar-item">
            <Icon icon="lucide:smile" class="sidebar-icon" />
            <span class="sidebar-label">昵称</span>
            <span class="sidebar-value">{{ userStore.nickname || '-' }}</span>
          </div>
          <div class="sidebar-item">
            <Icon icon="lucide:venus-and-mars" class="sidebar-icon" />
            <span class="sidebar-label">性别</span>
            <span class="sidebar-value">{{ getDictItem('system_user_sex', userStore.sex)?.value || '-' }}</span>
          </div>
          <div class="sidebar-item">
            <Icon icon="lucide:phone" class="sidebar-icon" />
            <span class="sidebar-label">手机号</span>
            <span class="sidebar-value">{{ userStore.phone || '-' }}</span>
          </div>
          <div class="sidebar-item">
            <Icon icon="lucide:mail" class="sidebar-icon" />
            <span class="sidebar-label">邮箱</span>
            <span class="sidebar-value">{{ userStore.email || '-' }}</span>
          </div>
          <div class="sidebar-item">
            <Icon icon="lucide:building-2" class="sidebar-icon" />
            <span class="sidebar-label">部门</span>
            <span class="sidebar-value">{{ userStore.deptName || '-' }}</span>
          </div>
          <div class="sidebar-item">
            <Icon icon="lucide:briefcase" class="sidebar-icon" />
            <span class="sidebar-label">岗位</span>
            <span class="sidebar-value">{{ userStore.postName || '-' }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧主内容 -->
    <main class="profile-main">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="修改资料" name="edit">
          <div class="form-card">
            <el-form
              ref="editFormRef"
              :model="editForm"
              :rules="editRules"
              label-width="80px"
              label-position="left"
            >
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="昵称" prop="nickname">
                    <el-input v-model="editForm.nickname" placeholder="请输入昵称" maxlength="20" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="手机号" prop="phone">
                    <el-input v-model="editForm.phone" placeholder="请输入手机号" maxlength="11" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="邮箱" prop="email">
                    <el-input v-model="editForm.email" placeholder="请输入邮箱" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="性别" prop="sex">
                    <el-radio-group v-model="editForm.sex">
                      <el-radio
                        v-for="item in getDictList('system_user_sex')"
                        :key="item.id"
                        :value="item.label"
                      >
                        {{ item.value }}
                      </el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item>
                <el-button type="primary" :loading="editLoading" @click="handleSaveProfile">保存修改</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="password">
          <div class="form-card">
            <el-form
              ref="pwdFormRef"
              :model="pwdForm"
              :rules="pwdRules"
              label-width="100px"
              label-position="left"
              class="pwd-form"
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
                <el-button type="primary" :loading="pwdLoading" @click="handleChangePassword">确认修改</el-button>
                <el-button @click="resetPwdForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="角色权限" name="permission">
          <div class="form-card">
            <h4 class="section-title">
              <Icon icon="lucide:shield-check" class="section-icon" />
              当前角色
            </h4>
            <div class="role-list">
              <div v-for="name in displayRoles" :key="name" class="role-item">
                <Icon icon="lucide:badge-check" class="role-badge" />
                <span>{{ name }}</span>
              </div>
            </div>
            <el-divider />
            <h4 class="section-title">
              <Icon icon="lucide:key-round" class="section-icon" />
              操作权限
              <el-tag size="small" type="info" effect="plain" style="margin-left: 8px">
                共 {{ userStore.permissions.length }} 项
              </el-tag>
            </h4>
            <div class="permission-grid">
              <el-tag
                v-for="perm in userStore.permissions"
                :key="perm"
                size="small"
                type="info"
                effect="plain"
              >
                {{ perm }}
              </el-tag>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="账户安全" name="security">
          <div class="form-card">
            <div class="security-list">
              <div class="security-item">
                <div class="security-info">
                  <Icon icon="lucide:lock" class="security-icon" />
                  <div>
                    <p class="security-label">登录密码</p>
                    <p class="security-desc">安全性高的密码可以保护您的账户安全</p>
                  </div>
                </div>
                <el-button type="primary" text @click="activeTab = 'password'">修改</el-button>
              </div>
              <div class="security-item">
                <div class="security-info">
                  <Icon icon="lucide:smartphone" class="security-icon" />
                  <div>
                    <p class="security-label">手机绑定</p>
                    <p class="security-desc">{{ userStore.phone ? `已绑定手机：${userStore.phone}` : '未绑定手机号' }}</p>
                  </div>
                </div>
                <el-tag :type="userStore.phone ? 'success' : 'warning'" size="small" effect="plain">
                  {{ userStore.phone ? '已绑定' : '未绑定' }}
                </el-tag>
              </div>
              <div class="security-item">
                <div class="security-info">
                  <Icon icon="lucide:mail" class="security-icon" />
                  <div>
                    <p class="security-label">邮箱绑定</p>
                    <p class="security-desc">{{ userStore.email ? `已绑定邮箱：${userStore.email}` : '未绑定邮箱' }}</p>
                  </div>
                </div>
                <el-tag :type="userStore.email ? 'success' : 'warning'" size="small" effect="plain">
                  {{ userStore.email ? '已绑定' : '未绑定' }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </main>

    <!-- 头像上传弹窗 -->
    <el-dialog v-model="avatarDialogVisible" title="上传头像" width="460px" @close="handleAvatarDialogClose">
      <div class="avatar-editor">
        <div
          ref="cropAreaRef"
          class="crop-area"
          @mousedown="onDragStart"
          @touchstart.prevent="onTouchStart"
          @wheel.prevent="onWheel"
        >
          <img
            v-if="previewUrl"
            ref="cropImageRef"
            :src="previewUrl"
            :style="cropImageStyle"
            draggable="false"
            @load="onImageLoad"
          />
          <div class="crop-mask"></div>
          <div class="crop-circle"></div>
        </div>
        <div v-if="previewUrl" class="crop-toolbar">
          <Icon icon="lucide:zoom-out" class="crop-tool-icon" @click="handleZoom(-0.1)" />
          <el-slider v-model="cropScale" :min="0.5" :max="3" :step="0.01" :show-tooltip="false" class="crop-slider" />
          <Icon icon="lucide:zoom-in" class="crop-tool-icon" @click="handleZoom(0.1)" />
        </div>
        <p v-if="previewUrl" class="crop-tip">拖拽调整位置，滚轮缩放大小</p>
        <div v-if="!previewUrl" class="avatar-placeholder">
          <Icon icon="lucide:image-plus" :width="48" :height="48" />
          <p>请选择图片</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="avatarDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!previewUrl" :loading="avatarUploading" @click="handleAvatarUpload">
          确认上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/pinia/stores/user'
import { useOssUrl } from '@@/composables/useOssUrl'
import { useDict } from '@/common/composables/useDict'
import { changePassword, modifyUserById } from '../apis'
import type { FormRules } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { ossUrl } = useOssUrl()
const { getDictList, getDictItem } = useDict(['system_user_sex'])

const activeTab = ref((route.params.activeTab as string) || 'edit')

const avatarUrl = computed(() => {
  if (userStore.headUrl) return ossUrl.value + userStore.headUrl
  return ''
})

const avatarFallback = computed(() => {
  const name = userStore.username
  return name ? name.charAt(0).toUpperCase() : 'U'
})

const displayRoles = computed(() => {
  return userStore.roleNames.length > 0 ? userStore.roleNames : userStore.roles
})

// 头像上传
const fileInputRef = useTemplateRef('fileInputRef')
const cropAreaRef = useTemplateRef('cropAreaRef')
const cropImageRef = useTemplateRef('cropImageRef')
const avatarDialogVisible = ref(false)
const avatarUploading = ref(false)
const previewUrl = ref('')
const selectedFile = ref<File | null>(null)

// 裁切状态
const cropScale = ref(1)
const cropX = ref(0)
const cropY = ref(0)
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let startCropX = 0
let startCropY = 0

const cropImageStyle = computed(() => ({
  transform: `translate(${cropX.value}px, ${cropY.value}px) scale(${cropScale.value})`,
}))

function handleAvatarClick() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  cropScale.value = 1
  cropX.value = 0
  cropY.value = 0
  avatarDialogVisible.value = true
  input.value = ''
}

function onImageLoad() {
  cropScale.value = 1
  cropX.value = 0
  cropY.value = 0
}

function onDragStart(e: MouseEvent) {
  if (!previewUrl.value) return
  isDragging = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  startCropX = cropX.value
  startCropY = cropY.value
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!isDragging) return
  cropX.value = startCropX + (e.clientX - dragStartX)
  cropY.value = startCropY + (e.clientY - dragStartY)
}

function onDragEnd() {
  isDragging = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

function onTouchStart(e: TouchEvent) {
  if (!previewUrl.value) return
  const touch = e.touches[0]
  isDragging = true
  dragStartX = touch.clientX
  dragStartY = touch.clientY
  startCropX = cropX.value
  startCropY = cropY.value
  document.addEventListener('touchmove', onTouchMove)
  document.addEventListener('touchend', onTouchEnd)
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging) return
  const touch = e.touches[0]
  cropX.value = startCropX + (touch.clientX - dragStartX)
  cropY.value = startCropY + (touch.clientY - dragStartY)
}

function onTouchEnd() {
  isDragging = false
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
}

function onWheel(e: WheelEvent) {
  if (!previewUrl.value) return
  const delta = e.deltaY > 0 ? -0.05 : 0.05
  handleZoom(delta)
}

function handleZoom(delta: number) {
  cropScale.value = Math.min(3, Math.max(0.5, cropScale.value + delta))
}

function handleAvatarUpload() {
  if (!selectedFile.value) return
  avatarUploading.value = true
  // TODO: 对接后端 uploadAvatar 接口，可用 canvas 裁切后上传
  setTimeout(() => {
    avatarUploading.value = false
    avatarDialogVisible.value = false
    ElMessage.success('头像上传成功')
  }, 800)
}

function handleAvatarDialogClose() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = ''
  selectedFile.value = null
  cropScale.value = 1
  cropX.value = 0
  cropY.value = 0
}

// 修改资料
const editFormRef = useTemplateRef('editFormRef')
const editForm = reactive({
  nickname: userStore.nickname || '',
  phone: userStore.phone || '',
  email: userStore.email || '',
  sex: userStore.sex || '',
})

const editRules: FormRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱', trigger: 'blur' },
  ],
}

const editLoading = ref(false)

function handleSaveProfile() {
  editFormRef.value?.validate((valid: boolean) => {
    if (!valid) return
    editLoading.value = true
    modifyUserById({
      id: userStore.userId,
      username: userStore.username,
      nickname: editForm.nickname,
      sex: editForm.sex,
      phone: editForm.phone,
      email: editForm.email,
      deptId: userStore.deptId,
      deptName: userStore.deptName,
      postId: userStore.postId,
      postName: userStore.postName,
      status: '0',
      roleIds: [],
    })
      .then((res) => {
        ElMessage.success(res.msg || '资料修改成功')
        userStore.getInfo()
      })
      .finally(() => {
        editLoading.value = false
      })
  })
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
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
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

const pwdLoading = ref(false)

function handleChangePassword() {
  pwdFormRef.value?.validate((valid: boolean) => {
    if (!valid) return
    pwdLoading.value = true
    changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
    })
      .then((res) => {
        ElMessage.success(res.msg || '密码修改成功，即将退出登录')
        resetPwdForm()
        setTimeout(() => {
          userStore.logout()
          router.push('/login')
        }, 1500)
      })
      .finally(() => {
        pwdLoading.value = false
      })
  })
}

function resetPwdForm() {
  pwdFormRef.value?.resetFields()
}
</script>

<style lang="scss" scoped>
.profile-page {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--p-space-4);
  padding: var(--p-space-5);
  min-height: calc(100vh - 120px);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// 左侧栏
.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-4);
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--p-space-6) var(--p-space-4);
  border-radius: var(--card-radius);
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);
  text-align: center;

  .avatar-wrapper {
    position: relative;
    cursor: pointer;
    margin-bottom: var(--p-space-3);
    border-radius: 50%;

    &:hover .avatar-overlay {
      opacity: 1;
    }
  }

  .avatar-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    opacity: 0;
    transition: opacity var(--p-duration-fast);
  }

  .user-avatar {
    background: var(--theme-accent-light);
    color: var(--theme-accent);

    .avatar-text {
      font-family: var(--p-font-display);
      font-size: 28px;
      font-weight: var(--p-weight-bold);
    }
  }

  .user-name {
    margin: 0 0 var(--p-space-2);
    font-family: var(--p-font-display);
    font-size: var(--p-text-lg);
    font-weight: var(--p-weight-bold);
    color: var(--theme-text-primary);
  }

  .user-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
}

.sidebar-card {
  padding: var(--p-space-4);
  border-radius: var(--card-radius);
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);
}

.sidebar-title {
  margin: 0 0 var(--p-space-3);
  font-family: var(--p-font-display);
  font-size: var(--p-text-sm);
  font-weight: var(--p-weight-semibold);
  color: var(--theme-text-primary);
}

.sidebar-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-3);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--p-space-2);
  font-size: var(--p-text-sm);

  .sidebar-icon {
    font-size: 14px;
    color: var(--theme-accent);
    flex-shrink: 0;
  }

  .sidebar-label {
    color: var(--theme-text-muted);
    white-space: nowrap;
  }

  .sidebar-value {
    margin-left: auto;
    color: var(--theme-text-primary);
    font-weight: var(--p-weight-medium);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// 右侧主区域
.profile-main {
  min-width: 0;
}

.profile-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
    padding: 0 var(--p-space-4);
    background: var(--theme-bg-surface);
    border: 1px solid var(--theme-border);
    border-bottom: none;
    border-radius: var(--card-radius) var(--card-radius) 0 0;
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

  :deep(.el-tabs__content) {
    padding: var(--p-space-5);
    background: var(--theme-bg-surface);
    border: 1px solid var(--theme-border);
    border-top: none;
    border-radius: 0 0 var(--card-radius) var(--card-radius);
  }
}

.form-card {
  // 表单卡片无额外外层，tabs content 本身已有背景
}

.pwd-form {
  max-width: 420px;
}

// 角色权限
.section-title {
  margin: 0 0 var(--p-space-3);
  font-family: var(--p-font-display);
  font-size: var(--p-text-md);
  font-weight: var(--p-weight-semibold);
  color: var(--theme-text-primary);
  display: flex;
  align-items: center;
  gap: var(--p-space-2);

  .section-icon {
    font-size: 18px;
    color: var(--theme-accent);
  }
}

.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--p-space-3);
}

.role-item {
  display: flex;
  align-items: center;
  gap: var(--p-space-2);
  padding: var(--p-space-2) var(--p-space-3);
  border-radius: var(--p-radius-md);
  background: var(--theme-bg-elevated);
  font-size: var(--p-text-sm);
  color: var(--theme-text-primary);

  .role-badge {
    font-size: 16px;
    color: var(--theme-accent);
  }
}

.permission-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

// 账户安全
.security-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--p-space-4) 0;
  border-bottom: 1px solid var(--theme-border);

  &:last-child {
    border-bottom: none;
  }

  .security-info {
    display: flex;
    align-items: center;
    gap: var(--p-space-3);
  }

  .security-icon {
    font-size: 20px;
    color: var(--theme-accent);
    flex-shrink: 0;
  }

  .security-label {
    margin: 0;
    font-size: var(--p-text-sm);
    font-weight: var(--p-weight-medium);
    color: var(--theme-text-primary);
  }

  .security-desc {
    margin: 2px 0 0;
    font-size: var(--p-text-xs);
    color: var(--theme-text-muted);
  }
}

// 头像编辑器
.avatar-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--p-space-3);
}

.crop-area {
  position: relative;
  width: 280px;
  height: 280px;
  overflow: hidden;
  border-radius: var(--p-radius-md);
  background: #1a1a1a;
  cursor: grab;
  user-select: none;

  &:active {
    cursor: grabbing;
  }

  img {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -140px;
    margin-left: -140px;
    width: 280px;
    height: 280px;
    object-fit: cover;
    pointer-events: none;
    transition: none;
  }
}

.crop-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  mask-image: radial-gradient(circle 120px at center, transparent 120px, black 120px);
  -webkit-mask-image: radial-gradient(circle 120px at center, transparent 120px, black 120px);
  pointer-events: none;
}

.crop-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 240px;
  height: 240px;
  margin-top: -120px;
  margin-left: -120px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  pointer-events: none;
}

.crop-toolbar {
  display: flex;
  align-items: center;
  gap: var(--p-space-3);
  width: 280px;

  .crop-slider {
    flex: 1;
  }

  .crop-tool-icon {
    font-size: 18px;
    color: var(--theme-text-muted);
    cursor: pointer;
    transition: color var(--p-duration-fast);

    &:hover {
      color: var(--theme-accent);
    }
  }
}

.crop-tip {
  margin: 0;
  font-size: var(--p-text-xs);
  color: var(--theme-text-muted);
}

.avatar-placeholder {
  width: 280px;
  height: 280px;
  border-radius: var(--p-radius-md);
  border: 2px dashed var(--theme-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--theme-text-muted);

  p {
    margin: var(--p-space-2) 0 0;
    font-size: var(--p-text-sm);
  }
}

@media (max-width: 900px) {
  .profile-page {
    padding: var(--p-space-4);
  }
}
</style>
