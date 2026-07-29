<template>
  <UseCrudView :slotProps="crud.slotProps" :formRules="formRules" :add-title="$t('system.user.dialogs.add')" :edit-title="$t('system.user.dialogs.edit')">
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="username" :label="$t('system.user.search.username')">
        <el-input v-model="searchData.username" :placeholder="$t('system.user.formPlaceholder.username')" />
      </el-form-item>
      <el-form-item prop="phone" :label="$t('system.user.search.phone')">
        <el-input v-model="searchData.phone" :placeholder="$t('system.user.formPlaceholder.phone')" />
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
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item prop="status" :label="$t('system.user.search.status')">
        <el-select v-model="searchData.status" :placeholder="$t('system.user.formPlaceholder.status')" clearable style="width: 150px">
          <el-option
            v-for="item in getDictList('system_status')"
            :key="item.id"
            :label="item.value"
            :value="item.label!"
          />
        </el-select>
      </el-form-item>
    </template>

    <!-- 工具栏按钮 -->
    <template #actions="{ rowSelection }">
      <el-button type="primary" @click="crud.methods.handleAdd">
        <template #icon><Icon icon="lucide:plus-circle" /></template>{{ $t('common.add') }}
      </el-button>
      <el-button type="danger" @click="handleBatchRemove">
        <template #icon><Icon icon="lucide:trash-2" /></template>{{ $t('system.user.actions.batchDelete') }} ({{ rowSelection.length }})
      </el-button>
      <TableColumnSetting
        :columns="tableColumns.columns.value"
        @toggle="tableColumns.toggleColumn"
        @reorder="tableColumns.reorderColumns"
        @reset="tableColumns.resetColumns"
      />
    </template>

    <!-- 表格列 -->
    <template #table>
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column v-if="isColumnVisible('username')" prop="username" :label="$t('system.user.columns.username')" align="center" />
      <el-table-column v-if="isColumnVisible('nickname')" prop="nickname" :label="$t('system.user.form.nickname')" align="center" />
      <el-table-column v-if="isColumnVisible('deptName')" prop="deptName" :label="$t('system.user.search.dept')" align="center" />
      <el-table-column v-if="isColumnVisible('postName')" prop="postName" :label="$t('system.user.columns.postName')" align="center" />
      <el-table-column v-if="isColumnVisible('phone')" prop="phone" :label="$t('system.user.search.phone')" align="center" />
      <el-table-column v-if="isColumnVisible('status')" prop="status" :label="$t('system.user.search.status')" align="center" width="80">
        <template #default="scope">
          <el-tag
            :type="getDictItem('system_status', scope.row.status)?.listClass || 'info'"
            effect="plain"
            size="small"
            disable-transitions
          >
            {{ getDictItem('system_status', scope.row.status)?.value }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="isColumnVisible('createTime')" prop="createTime" :label="$t('system.user.columns.createTime')" align="center" min-width="160" />
      <el-table-column fixed="right" :label="$t('common.action')" width="120" align="center">
        <template #default="scope">
          <el-tooltip :content="$t('common.edit')" placement="top">
            <el-button
              type="warning"
              text
              bg
              size="small"
              @click="crud.methods.handleEdit(scope.row)"
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
              @click="crud.methods.handleRemove(scope.row)"
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
          <el-input v-model="formData.username" :placeholder="$t('system.user.formPlaceholder.username')" maxlength="20" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="nickname" :label="$t('system.user.form.nickname')">
          <el-input v-model="formData.nickname" :placeholder="$t('system.user.formPlaceholder.nickname')" maxlength="20" />
        </el-form-item>
      </el-col>
      <el-col :span="12" v-if="formData.id === undefined">
        <el-form-item prop="password" :label="$t('system.user.form.password')">
          <el-input v-model="formData.password" type="password" :placeholder="$t('system.user.formPlaceholder.password')" show-password />
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
          <el-select v-model="formData.sex" :placeholder="$t('system.user.formPlaceholder.sex')" style="width: 100%">
            <el-option
              v-for="item in getDictList('system_user_sex')"
              :key="item.id"
              :label="item.value"
              :value="item.label!"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="phone" :label="$t('system.user.search.phone')">
          <el-input v-model="formData.phone" :placeholder="$t('system.user.formPlaceholder.phone')" maxlength="11" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="email" :label="$t('system.user.form.email')">
          <el-input v-model="formData.email" :placeholder="$t('system.user.formPlaceholder.email')" maxlength="20" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="idCard" :label="$t('system.user.form.idCard')">
          <el-input v-model="formData.idCard" :placeholder="$t('system.user.formPlaceholder.idCard')" maxlength="18" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="roleIds" :label="$t('system.user.form.roleIds')">
          <el-select v-model="formData.roleIds" :placeholder="$t('system.user.formPlaceholder.roleIds')" multiple style="width: 100%">
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
              :value="item.label"
            >
              {{ item.value }}
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
import { useI18n } from "vue-i18n"
import { Icon } from '@iconify/vue'
import { ref, nextTick } from 'vue'
import type { FormRules } from 'element-plus'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { useDict } from '@/common/composables/useDict'
import { useTableColumns } from '@@/composables/useTableColumns'
import TableColumnSetting from '@@/components/TableColumnSetting/index.vue'
import { userPage, getUserById, addUser, modifyUserById, removeUserByIds, resetPassword } from './apis'
import type { SystemUserVO, SystemUserQueryVO } from './apis/type'
import { deptTreeList } from '@/views/system/dept/apis'
import { postListByDeptId } from '@/views/system/post/apis'
import { roleList } from '@/views/system/role/apis'

const { t } = useI18n(); const $t = t

defineOptions({ name: 'user' })

// ─── 字典 ─────────────────────────────────────────────────
const { getDictList, getDictItem } = useDict(['system_status', 'system_user_sex'])

// ─── CRUD 核心（状态 + 搜索/分页/删除/弹窗生命周期） ──────
const crud = useCrud<SystemUserQueryVO, SystemUserVO>({
  pageApi: (query) => userPage(query),
  addApi: (data) => addUser(data),
  updateApi: (data) => modifyUserById(data),
  removeApi: (ids) => removeUserByIds(ids),
  defaultForm: () => ({ status: '0', roleIds: [] }),
})

// ─── 表格列配置 ────────────────────────────────────────────
const tableColumns = useTableColumns({
  key: 'system-user',
  defaultColumns: [
    { prop: 'username', label: $t('system.user.columns.username') },
    { prop: 'nickname', label: $t('system.user.columns.nickname') },
    { prop: 'deptName', label: $t('system.user.columns.deptName') },
    { prop: 'postName', label: $t('system.user.columns.postName') },
    { prop: 'phone', label: $t('system.user.columns.phone') },
    { prop: 'status', label: $t('system.user.columns.status'), width: 80 },
    { prop: 'createTime', label: $t('system.user.columns.createTime') },
  ],
})

function isColumnVisible(prop: string) {
  return tableColumns.visibleColumns.value.some((c) => c.prop === prop)
}

// ─── 依赖数据（部门树 / 岗位 / 角色） ─────────────────────
const deptTreeData = ref<any[]>([])
const postList = ref<any[]>([])
const roleOptions = ref<any[]>([])

const formRef = ref(null)
const formRules: FormRules = {
  username: [{ required: true, trigger: 'blur', message: () => $t('system.user.form.username') }],
  nickname: [{ required: true, trigger: 'blur', message: () => $t('system.user.form.nickname') }],
  password: [
    { required: true, trigger: 'blur', message: () => $t('system.user.form.password') },
    { min: 6, max: 20, message: () => $t('common.validation.passwordLength'), trigger: 'blur' },
  ],
  deptId: [{ required: true, trigger: 'change', message: () => $t('system.user.formPlaceholder.deptId') }],
  postId: [{ required: true, trigger: 'change', message: () => $t('system.user.formPlaceholder.postId') }],
  sex: [{ required: true, trigger: 'change', message: () => $t('system.user.formPlaceholder.sex') }],
  roleIds: [{ required: true, trigger: 'change', message: () => $t('system.user.formPlaceholder.roleIds') }],
}

function getDeptTree() {
  deptTreeList({}).then(({ data }) => { deptTreeData.value = data })
}

function getRoleOptions() {
  roleList().then(({ data }) => { roleOptions.value = data })
}

function findDeptNode(tree: any[], id: number): any | undefined {
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
  if (deptId) {
    const node = findDeptNode(deptTreeData.value, deptId)
    crud.state.formData.value.deptName = node?.deptName
    postListByDeptId(deptId).then(({ data }) => { postList.value = data })
  } else {
    crud.state.formData.value.deptName = undefined
  }
  crud.state.formData.value.postId = undefined
  crud.state.formData.value.postName = undefined
}

function handlePostChange(postId: number | undefined) {
  if (postId) {
    const post = postList.value.find((item: any) => item.id === postId)
    crud.state.formData.value.postName = post?.postName
  } else {
    crud.state.formData.value.postName = undefined
  }
}

// 编辑时回填：composable 的 handleEdit 会设置 formData，这里补充加载岗位列表
const originalHandleEdit = crud.methods.handleEdit
crud.methods.handleEdit = (row: SystemUserVO) => {
  originalHandleEdit(row)
  if (row.deptId) {
    postListByDeptId(row.deptId).then(({ data }) => { postList.value = data })
  }
}

// ─── 自定义批量删除（保留原始提示文案） ──────────────────────
function handleBatchRemove() {
  const selectedRows = crud.slotProps.rowSelection
  if (selectedRows.length === 0) {
    ElMessage.warning($t('common.messages.selectFirst'))
    return
  }
  const ids = selectedRows.map((r: any) => r.id).join(',')
  ElMessageBox.confirm($t('system.user.messages.batchDeleteConfirm', { count: selectedRows.length }), $t('common.messages.confirmTitle'), {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    type: 'warning',
  }).then(() => {
    removeUserByIds(ids).then((res) => {
      ElMessage.success(res.msg || $t('common.messages.operationSuccess'))
      crud.methods.getTableData()
    })
  })
}

// ─── 重置密码（模块特有，保留在父组件） ──────────────────
function handleResetPwd(row: SystemUserVO) {
  ElMessageBox.prompt($t('common.messages.passwordResetPrompt', { username: row.username }), $t('common.messages.promptTitle'), {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    inputPattern: /^.{6,20}$/,
    inputErrorMessage: $t('common.validation.passwordLength'),
    inputType: 'password',
  }).then(({ value }) => {
    resetPassword(row.id!, value).then((res) => {
      ElMessage.success(res.msg || $t('common.messages.resetSuccess'))
    })
  })
}

// ─── 初始化依赖数据 ──────────────────────────────────────
getDeptTree()
getRoleOptions()
</script>

<style lang="scss" scoped>
</style>
