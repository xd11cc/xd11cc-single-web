<template>
  <UseCrudView :slotProps="crud.slotProps" :formRules="formRules" add-title="新增用户" edit-title="修改用户">
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="username" label="用户名">
        <el-input v-model="searchData.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item prop="phone" label="手机号">
        <el-input v-model="searchData.phone" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item prop="deptId" label="部门">
        <el-tree-select
          v-model="searchData.deptId"
          :data="deptTreeData"
          :props="{ label: 'deptName', children: 'children' }"
          value-key="id"
          placeholder="请选择部门"
          check-strictly
          clearable
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item prop="status" label="状态">
        <el-select v-model="searchData.status" placeholder="用户状态" clearable style="width: 150px">
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
        <template #icon><Icon icon="lucide:plus-circle" /></template>新增
      </el-button>
      <el-button type="danger" @click="handleBatchRemove">
        <template #icon><Icon icon="lucide:trash-2" /></template>批量删除 ({{ rowSelection.length }})
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
      <el-table-column v-if="isColumnVisible('username')" prop="username" label="用户名" align="center" />
      <el-table-column v-if="isColumnVisible('nickname')" prop="nickname" label="昵称" align="center" />
      <el-table-column v-if="isColumnVisible('deptName')" prop="deptName" label="部门" align="center" />
      <el-table-column v-if="isColumnVisible('postName')" prop="postName" label="岗位" align="center" />
      <el-table-column v-if="isColumnVisible('phone')" prop="phone" label="手机号" align="center" />
      <el-table-column v-if="isColumnVisible('status')" prop="status" label="状态" align="center" width="80">
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
      <el-table-column v-if="isColumnVisible('createTime')" prop="createTime" label="创建时间" align="center" min-width="160" />
      <el-table-column fixed="right" label="操作" width="240" align="center">
        <template #default="scope">
          <el-button
            type="warning"
            text
            bg
            size="small"
            @click="crud.methods.handleEdit(scope.row)"
            v-permission="['system:user:update']"
          >修改</el-button>
          <el-button
            type="danger"
            text
            bg
            size="small"
            @click="crud.methods.handleRemove(scope.row)"
            v-permission="['system:user:delete']"
          >删除</el-button>
          <el-button
            type="primary"
            text
            bg
            size="small"
            @click="handleResetPwd(scope.row)"
          >重置密码</el-button>
        </template>
      </el-table-column>
    </template>

    <!-- 弹窗表单字段 -->
    <template #form-fields="{ formData }">
      <el-col :span="12">
        <el-form-item prop="username" label="用户名">
          <el-input v-model="formData.username" placeholder="请输入用户名" maxlength="20" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="nickname" label="昵称">
          <el-input v-model="formData.nickname" placeholder="请输入昵称" maxlength="20" />
        </el-form-item>
      </el-col>
      <el-col :span="12" v-if="formData.id === undefined">
        <el-form-item prop="password" label="密码">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="deptId" label="部门">
          <el-tree-select
            v-model="formData.deptId"
            :data="deptTreeData"
            :props="{ label: 'deptName', children: 'children' }"
            value-key="id"
            placeholder="请选择部门"
            check-strictly
            style="width: 100%"
            @change="handleDeptChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="postId" label="岗位">
          <el-select
            v-model="formData.postId"
            placeholder="请先选择部门"
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
        <el-form-item prop="sex" label="性别">
          <el-select v-model="formData.sex" placeholder="请选择性别" style="width: 100%">
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
        <el-form-item prop="phone" label="手机号">
          <el-input v-model="formData.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="email" label="邮箱">
          <el-input v-model="formData.email" placeholder="请输入邮箱" maxlength="20" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="idCard" label="身份证号">
          <el-input v-model="formData.idCard" placeholder="请输入身份证号" maxlength="18" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="roleIds" label="角色">
          <el-select v-model="formData.roleIds" placeholder="请选择角色" multiple style="width: 100%">
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
        <el-form-item prop="status" label="状态">
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
        <el-form-item prop="remark" label="备注">
          <el-input
            type="textarea"
            v-model="formData.remark"
            placeholder="请输入内容"
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
    { prop: 'username', label: '用户名' },
    { prop: 'nickname', label: '昵称' },
    { prop: 'deptName', label: '部门' },
    { prop: 'postName', label: '岗位' },
    { prop: 'phone', label: '手机号' },
    { prop: 'status', label: '状态', width: 80 },
    { prop: 'createTime', label: '创建时间' },
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
  username: [{ required: true, trigger: 'blur', message: '请输入用户名' }],
  nickname: [{ required: true, trigger: 'blur', message: '请输入昵称' }],
  password: [
    { required: true, trigger: 'blur', message: '请输入密码' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  deptId: [{ required: true, trigger: 'change', message: '请选择部门' }],
  postId: [{ required: true, trigger: 'change', message: '请选择岗位' }],
  sex: [{ required: true, trigger: 'change', message: '请选择性别' }],
  roleIds: [{ required: true, trigger: 'change', message: '请选择角色' }],
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
    ElMessage.warning('请先选择要删除的数据')
    return
  }
  const ids = selectedRows.map((r: any) => r.id).join(',')
  ElMessageBox.confirm(`正在删除 ${selectedRows.length} 条用户数据，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeUserByIds(ids).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      crud.methods.getTableData()
    })
  })
}

// ─── 重置密码（模块特有，保留在父组件） ──────────────────
function handleResetPwd(row: SystemUserVO) {
  ElMessageBox.prompt(`请输入「${row.username}」的新密码`, '重置密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^.{6,20}$/,
    inputErrorMessage: '密码长度在 6 到 20 个字符之间',
    inputType: 'password',
  }).then(({ value }) => {
    resetPassword(row.id!, value).then((res) => {
      ElMessage.success(res.msg || '重置成功')
    })
  })
}

// ─── 初始化依赖数据 ──────────────────────────────────────
getDeptTree()
getRoleOptions()
</script>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 16px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}

.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.page-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
