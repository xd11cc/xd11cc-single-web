<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :columns="columns"
    :formRules="formRules"
    :add-title="$t('system.user.dialogs.add')"
    :edit-title="$t('system.user.dialogs.edit')"
  >
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="username" :label="$t('system.user.search.username')">
        <el-input
          v-model="searchData.username"
          :placeholder="$t('system.user.formPlaceholder.username')"
        />
      </el-form-item>
      <el-form-item prop="phone" :label="$t('system.user.search.phone')">
        <el-input
          v-model="searchData.phone"
          :placeholder="$t('system.user.formPlaceholder.phone')"
        />
      </el-form-item>
      <el-form-item prop="deptId" :label="$t('system.user.search.dept')">
        <el-tree-select
          v-model="searchData.deptId"
          :data="deptTreeData"
          :props="{ label: 'deptName', children: 'children' }"
          value-key="id"
          :placeholder="$t('system.user.formPlaceholder.deptId')"
          check-strictly
          clearable
          class="search-field-md"
        />
      </el-form-item>
      <el-form-item prop="status" :label="$t('system.user.search.status')">
        <el-select
          v-model="searchData.status"
          :placeholder="$t('system.user.formPlaceholder.status')"
          clearable
          class="search-field"
        >
          <el-option
            v-for="item in getDictList('system_status')"
            :key="item.id"
            :label="item.label"
            :value="item.value!"
          />
        </el-select>
      </el-form-item>
    </template>

    <!-- 工具栏按钮 -->
    <template #actions="{ rowSelection, handleAdd, handleBatchRemove }">
      <el-button type="primary" @click="handleAdd" v-permission="['system:user:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>{{ $t('common.add') }}
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchRemove"
        v-permission="['system:user:delete']"
      >
        <template #icon><Icon icon="lucide:trash-2" /></template>{{ $t('common.batchDelete') }} ({{
          rowSelection.length
        }})
      </el-button>
    </template>

    <!-- 选择列：固定在生成列之前 -->
    <template #table-prefix>
      <el-table-column v-if="canDeleteUsers" type="selection" width="50" align="center" />
    </template>

    <!-- 状态列：自定义单元格；其余列由壳按 columns 配置生成 -->
    <template #cell-status="{ row }">
      <el-tag
        :type="getDictItem('system_status', row.status)?.listClass || 'info'"
        effect="plain"
        size="small"
        disable-transitions
      >
        {{ getDictItem('system_status', row.status)?.label }}
      </el-tag>
    </template>

    <!-- 操作列：固定在生成列之后 -->
    <template #table-append="{ handleEdit, handleRemove }">
      <el-table-column fixed="right" :label="$t('common.action')" width="120" align="center">
        <template #default="scope">
          <el-tooltip :content="$t('common.edit')" placement="top">
            <el-button
              type="warning"
              text
              bg
              size="small"
              @click="handleEdit(scope.row)"
              v-permission="['system:user:update']"
            >
              <Icon icon="lucide:pencil" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('common.delete')" placement="top">
            <el-button
              type="danger"
              text
              bg
              size="small"
              @click="handleRemove(scope.row)"
              v-permission="['system:user:delete']"
            >
              <Icon icon="lucide:trash-2" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('system.user.actions.resetPassword')" placement="top">
            <el-button
              type="primary"
              text
              bg
              size="small"
              @click="handleResetPwd(scope.row)"
              v-permission="['system:user:resetPassword']"
            >
              <Icon icon="lucide:key-round" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </template>

    <!-- 弹窗表单字段 -->
    <template #form-fields="{ formData }">
      <el-col :span="12">
        <el-form-item prop="username" :label="$t('system.user.columns.username')">
          <el-input
            v-model="formData.username"
            :placeholder="$t('system.user.formPlaceholder.username')"
            maxlength="20"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="nickname" :label="$t('system.user.form.nickname')">
          <el-input
            v-model="formData.nickname"
            :placeholder="$t('system.user.formPlaceholder.nickname')"
            maxlength="20"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12" v-if="formData.id === undefined">
        <el-form-item prop="password" :label="$t('system.user.form.password')">
          <el-input
            v-model="formData.password"
            type="password"
            :placeholder="$t('system.user.formPlaceholder.password')"
            show-password
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="deptId" :label="$t('system.user.search.dept')">
          <el-tree-select
            v-model="formData.deptId"
            :data="deptTreeData"
            :props="{ label: 'deptName', children: 'children' }"
            value-key="id"
            :placeholder="$t('system.user.formPlaceholder.deptId')"
            check-strictly
            style="width: 100%"
            @change="handleDeptChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="postId" :label="$t('system.user.columns.postName')">
          <el-select
            v-model="formData.postId"
            :placeholder="$t('common.placeholder.selectDeptFirst')"
            :disabled="!formData.deptId"
            style="width: 100%"
            @change="handlePostChange"
          >
            <el-option
              v-for="item in postList"
              :key="item.id"
              :label="item.postName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="sex" :label="$t('system.user.form.sex')">
          <el-select
            v-model="formData.sex"
            :placeholder="$t('system.user.formPlaceholder.sex')"
            style="width: 100%"
          >
            <el-option
              v-for="item in getDictList('system_user_sex')"
              :key="item.id"
              :label="item.label"
              :value="item.value!"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="phone" :label="$t('system.user.search.phone')">
          <el-input
            v-model="formData.phone"
            :placeholder="$t('system.user.formPlaceholder.phone')"
            maxlength="11"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="email" :label="$t('system.user.form.email')">
          <el-input
            v-model="formData.email"
            :placeholder="$t('system.user.formPlaceholder.email')"
            maxlength="20"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="idCard" :label="$t('system.user.form.idCard')">
          <el-input
            v-model="formData.idCard"
            :placeholder="$t('system.user.formPlaceholder.idCard')"
            maxlength="18"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="roleIds" :label="$t('system.user.form.roleIds')">
          <el-select
            v-model="formData.roleIds"
            :placeholder="$t('system.user.formPlaceholder.roleIds')"
            multiple
            style="width: 100%"
          >
            <el-option
              v-for="item in roleOptions"
              :key="item.id"
              :label="item.roleName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="status" :label="$t('system.user.search.status')">
          <el-radio-group v-model="formData.status">
            <el-radio
              v-for="item in getDictList('system_status')"
              :key="item.id"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="remark" :label="$t('system.user.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.user.formPlaceholder.remark')"
            autosize
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
      </el-col>
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import type { FormRules } from 'element-plus'
import type { TableColumnDef } from '@@/composables/useTableColumns'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { useLatestRequest } from '@/common/composables/useLatestRequest'
import { useDict } from '@/common/composables/useDict'
import { userPage, addUser, modifyUserById, removeUserByIds, resetPassword } from './apis'
import type { SystemUserVO, SystemUserQueryVO } from './apis/type'
import type { SystemDeptTreeVO } from '@/views/system/dept/apis/type'
import type { SystemPostVO } from '@/views/system/post/apis/type'
import type { SystemRoleVO } from '@/views/system/role/apis/type'
import { deptTreeList } from '@/views/system/dept/apis'
import { postListByDeptId } from '@/views/system/post/apis'
import { roleList } from '@/views/system/role/apis'
import { useUserStore } from '@/pinia/stores/user'

const { t } = useI18n()
const userStore = useUserStore()
// 与 v-permission 指令保持一致：超管通配权限或明确的用户删除权限才可批量删除。
const canDeleteUsers = computed(() =>
  userStore.permissions.some(
    (permission) => permission === '*:*:*' || permission === 'system:user:delete',
  ),
)
const $t = t

defineOptions({ name: 'User' })

// ─── 字典 ─────────────────────────────────────────────────
const { getDictList, getDictItem } = useDict(['system_status', 'system_user_sex'])

// ─── CRUD 核心（状态 + 搜索/分页/删除/弹窗生命周期） ──────
// 快速切换部门时，先发的请求可能后回来，把岗位列表换成上一个部门的
const postRequest = useLatestRequest()

const crud = useCrud<SystemUserQueryVO, SystemUserVO>({
  pageApi: (query) => userPage(query),
  addApi: (data) => addUser(data),
  updateApi: (data) => modifyUserById(data),
  removeApi: (ids) => removeUserByIds(ids),
  defaultForm: () => ({ status: '0', roleIds: [] }),
  batchRemoveConfirmText: (count) => $t('system.user.messages.batchDeleteConfirm', { count }),
  // 编辑时补加载岗位列表（模块特有逻辑）
  onDialogOpen: ({ isAdd, row }) => {
    if (isAdd || !row?.deptId) return
    const rowId = row.id
    // 与 handleDeptChange 共用同一个序号：紧接着换部门时，这次初始化请求会被判为过期，
    // 否则它迟到返回会把新部门下的岗位覆盖掉
    const requestId = postRequest.begin()
    postListByDeptId(row.deptId).then(({ data }) => {
      if (!postRequest.isCurrent(requestId)) return
      if (crud.state.formData.value.id !== rowId) return
      postList.value = data
    })
  },
})

// ─── 表格列定义 ────────────────────────────────────────────
// 只声明「这一列长什么样」；排序 / 显隐 / 列宽由壳统一管理并持久化
const columns = computed<TableColumnDef[]>(() => [
  { prop: 'username', label: $t('system.user.columns.username'), minWidth: 120 },
  { prop: 'nickname', label: $t('system.user.columns.nickname'), minWidth: 120 },
  { prop: 'deptName', label: $t('system.user.columns.deptName'), minWidth: 140 },
  { prop: 'postName', label: $t('system.user.columns.postName'), minWidth: 140 },
  { prop: 'phone', label: $t('system.user.columns.phone'), minWidth: 140 },
  { prop: 'status', label: $t('system.user.search.status'), width: 90, align: 'center' },
  { prop: 'createTime', label: $t('system.user.columns.createTime'), width: 170, align: 'center' },
])

// ─── 依赖数据（部门树 / 岗位 / 角色） ─────────────────────
const deptTreeData = ref<SystemDeptTreeVO[]>([])
const postList = ref<SystemPostVO[]>([])
const roleOptions = ref<SystemRoleVO[]>([])

const formRef = ref(null)
const formRules: FormRules = {
  username: [{ required: true, trigger: 'blur', message: () => $t('system.user.form.username') }],
  nickname: [{ required: true, trigger: 'blur', message: () => $t('system.user.form.nickname') }],
  password: [
    { required: true, trigger: 'blur', message: () => $t('system.user.form.password') },
    { min: 8, max: 16, message: () => $t('common.validation.passwordLength'), trigger: 'blur' },
  ],
  deptId: [
    { required: true, trigger: 'change', message: () => $t('system.user.formPlaceholder.deptId') },
  ],
  postId: [
    { required: true, trigger: 'change', message: () => $t('system.user.formPlaceholder.postId') },
  ],
  sex: [
    { required: true, trigger: 'change', message: () => $t('system.user.formPlaceholder.sex') },
  ],
  roleIds: [
    { required: true, trigger: 'change', message: () => $t('system.user.formPlaceholder.roleIds') },
  ],
}

function getDeptTree() {
  deptTreeList({}).then(({ data }) => {
    deptTreeData.value = data
  })
}

function getRoleOptions() {
  roleList().then(({ data }) => {
    roleOptions.value = data
  })
}

function findDeptNode(tree: SystemDeptTreeVO[], id: number): SystemDeptTreeVO | undefined {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findDeptNode(node.children, id)
      if (found) return found
    }
  }
  return undefined
}

// ─── 部门联动岗位（模块特有逻辑，保留在父组件） ────────────

function handleDeptChange(deptId: number | undefined) {
  postList.value = []
  const requestId = postRequest.begin()
  if (deptId) {
    const node = findDeptNode(deptTreeData.value, deptId)
    crud.state.formData.value.deptName = node?.deptName
    postListByDeptId(deptId).then(({ data }) => {
      if (!postRequest.isCurrent(requestId)) return
      postList.value = data
    })
  } else {
    crud.state.formData.value.deptName = undefined
  }
  crud.state.formData.value.postId = undefined
  crud.state.formData.value.postName = undefined
}

function handlePostChange(postId: number | undefined) {
  if (postId) {
    const post = postList.value.find((item) => item.id === postId)
    crud.state.formData.value.postName = post?.postName
  } else {
    crud.state.formData.value.postName = undefined
  }
}

// ─── 重置密码（模块特有，保留在父组件） ──────────────────
function handleResetPwd(row: SystemUserVO) {
  ElMessageBox.prompt(
    $t('common.messages.passwordResetPrompt', { username: row.username }),
    $t('common.messages.promptTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      inputPattern: /^.{8,16}$/,
      inputErrorMessage: $t('common.validation.passwordLength'),
      inputType: 'password',
    },
  ).then(({ value }) => {
    resetPassword(row.id!, value).then((res) => {
      ElMessage.success(res.msg || $t('common.messages.resetSuccess'))
    })
  })
}

// ─── 初始化依赖数据 ──────────────────────────────────────
getDeptTree()
getRoleOptions()
</script>
