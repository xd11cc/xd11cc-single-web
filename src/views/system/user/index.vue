<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
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
          <el-select
            v-model="searchData.status"
            placeholder="用户状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in getDictList('system_status')"
              :key="item.id"
              :label="item.value"
              :value="item.label!"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template>查询</el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button
            type="primary"
            @click="handleAdd"
            v-permission="['system:user:add']"
          >
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            新增
          </el-button>
          <el-button
            type="danger"
            @click="handleBatchRemove"
            v-permission="['system:user:delete']"
          >
            <template #icon><Icon icon="lucide:trash-2" /></template>
            批量删除
          </el-button>
        </div>
        <TableColumnSetting
          :columns="tableColumns.columns.value"
          @toggle="tableColumns.toggleColumn"
          @reorder="tableColumns.reorderColumns"
          @reset="tableColumns.resetColumns"
        />
      </div>
      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column v-if="isColumnVisible('username')" prop="username" label="用户名" align="center" show-overflow-tooltip />
          <el-table-column v-if="isColumnVisible('nickname')" prop="nickname" label="昵称" align="center" show-overflow-tooltip />
          <el-table-column v-if="isColumnVisible('deptName')" prop="deptName" label="部门" align="center" show-overflow-tooltip />
          <el-table-column v-if="isColumnVisible('postName')" prop="postName" label="岗位" align="center" show-overflow-tooltip />
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
          <el-table-column v-if="isColumnVisible('createTime')" prop="createTime" label="创建时间" align="center" min-width="160" show-overflow-tooltip />
          <el-table-column fixed="right" label="操作" width="200" align="center">
            <template #default="scope">
              <el-button
                type="primary"
                text
                bg
                size="small"
                @click="handleModify(scope.row)"
                v-permission="['system:user:update']"
              >修改</el-button>
              <el-button
                type="danger"
                text
                bg
                size="small"
                @click="handleRemove(scope.row)"
                v-permission="['system:user:delete']"
              >删除</el-button>
              <el-button
                type="warning"
                text
                bg
                size="small"
                @click="handleResetPwd(scope.row)"
                v-permission="['system:user:resetPwd']"
              >重置</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="page-wrapper">
        <el-pagination
          background
          :layout="paginationData.layout"
          :page-sizes="paginationData.pageSizes"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :current-page="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增、修改弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增用户' : '修改用户'"
      width="40%"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        label-position="left"
      >
        <el-row :gutter="20">
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
                @node-click="handleDeptNodeClick"
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
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleCreateOrUpdate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { usePagination } from '@@/composables/usePagination'
import { useTableColumns } from '@@/composables/useTableColumns'
import TableColumnSetting from '@@/components/TableColumnSetting/index.vue'
import type { FormRules } from 'element-plus'
import { userPage, getUserById, addUser, modifyUserById, removeUserByIds, resetPassword } from './apis'
import type { SystemUserVO, SystemUserQueryVO } from './apis/type'
import { deptTreeList } from '@/views/system/dept/apis'
import { postListByDeptId } from '@/views/system/post/apis'
import { roleList } from '@/views/system/role/apis'

defineOptions({
  name: 'user',
})

const { getDictList, getDictItem } = useDict(['system_status', 'system_user_sex'])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

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

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)

const deptTreeData = ref<any[]>([])
const postList = ref<any[]>([])
const roleOptions = ref<any[]>([])

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemUserQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<SystemUserVO[]>([])

const formRef = useTemplateRef('formRef')
const DEFAULT_FORM = { status: '0', roleIds: [] }
const formData = ref<any>({ ...DEFAULT_FORM })

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

function handleSearch() {
  paginationData.currentPage = 1
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  paginationData.currentPage = 1
  getTableData()
}

function handleAdd() {
  dialogVisible.value = true
  formData.value = { ...DEFAULT_FORM }
  postList.value = []
}

function handleModify(row: SystemUserVO) {
  dialogVisible.value = true
  getUserById(row.id!).then(({ data }) => {
    formData.value = data
    if (data.deptId) {
      loadPostList(data.deptId)
    }
  })
}

function handleClose() {
  formData.value = { ...DEFAULT_FORM }
  formRef.value?.clearValidate()
  postList.value = []
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    submitLoading.value = true
    const isAdd = formData.value.id === undefined
    const api = isAdd ? addUser(formData.value) : modifyUserById(formData.value)
    api
      .then((res) => {
        ElMessage.success(res.msg || '操作成功')
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        submitLoading.value = false
      })
  })
}

function handleRemove(row: SystemUserVO) {
  ElMessageBox.confirm(`正在删除用户「${row.username}」，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeUserByIds(String(row.id)).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      getTableData()
    })
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemUserVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(`正在删除 ${selectedRows.length} 条用户数据，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeUserByIds(ids).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      getTableData()
    })
  })
}

function handleResetPwd(row: SystemUserVO) {
  ElMessageBox.prompt('请输入新密码', `重置「${row.username}」的密码`, {
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

function handleDeptChange(deptId: number | undefined) {
  formData.value.postId = undefined
  formData.value.postName = undefined
  if (!deptId) {
    formData.value.deptName = undefined
    postList.value = []
  }
}

function handleDeptNodeClick(node: any) {
  formData.value.deptName = node.deptName
  if (node.id) {
    loadPostList(node.id)
  }
}

function handlePostChange(postId: number | undefined) {
  if (postId) {
    const post = postList.value.find((item: any) => item.id === postId)
    formData.value.postName = post?.postName
  } else {
    formData.value.postName = undefined
  }
}

function loadPostList(deptId: number) {
  postListByDeptId(deptId).then(({ data }) => {
    postList.value = data
  })
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

function getTableData() {
  loading.value = true
  const params: SystemUserQueryVO = {
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  userPage(params)
    .then(({ data }) => {
      tableData.value = data.rows
      paginationData.total = data.total
    })
    .catch(() => {
      tableData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

getDeptTree()
getRoleOptions()

watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, {
  immediate: true,
})
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
