<template>
  <div class="app-container">
    <div class="user-layout">
      <!-- 左侧部门树 -->
      <el-card shadow="never" class="dept-card">
        <template #header>
          <div class="dept-header">
            <span>部门列表</span>
            <Icon
              icon="ep:refresh"
              class="refresh-icon"
              @click="getDeptTree"
            />
          </div>
        </template>
        <el-input
          v-model="deptFilterText"
          placeholder="搜索部门"
          clearable
          size="small"
          class="dept-search"
        >
          <template #prefix><Icon icon="ep:search" /></template>
        </el-input>
        <el-tree
          ref="deptTreeRef"
          :data="deptTreeData"
          :props="{ label: 'deptName', children: 'children' }"
          node-key="id"
          default-expand-all
          highlight-current
          :filter-node-method="filterDeptNode"
          @node-click="handleDeptClick"
        />
      </el-card>

      <!-- 右侧用户列表 -->
      <div class="user-content">
        <el-card shadow="never" class="search-wrapper">
          <el-form ref="searchFormRef" :inline="true" :model="searchData">
            <el-form-item prop="username" label="用户名">
              <el-input v-model="searchData.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item prop="phone" label="手机号">
              <el-input v-model="searchData.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item prop="status" label="状态">
              <el-select
                v-model="searchData.status"
                placeholder="用户状态"
                clearable
                style="width: 150px"
              >
                <el-option label="正常" value="0" />
                <el-option label="停用" value="1" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">
                <template #icon><Icon icon="ep:search" /></template>查询</el-button>
              <el-button @click="resetSearch">
                <template #icon><Icon icon="ep:refresh" /></template>重置</el-button>
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
                <template #icon><Icon icon="ep:circle-plus" /></template>
                新增
              </el-button>
              <el-button
                type="danger"
                @click="handleBatchRemove"
                v-permission="['system:user:delete']"
              >
                <template #icon><Icon icon="ep:delete" /></template>
                批量删除
              </el-button>
            </div>
          </div>
          <div class="table-wrapper">
            <el-table ref="tableRef" :data="tableData">
              <el-table-column type="selection" width="50" align="center" />
              <el-table-column prop="username" label="用户名" align="center" show-overflow-tooltip />
              <el-table-column prop="nickname" label="昵称" align="center" show-overflow-tooltip />
              <el-table-column prop="deptName" label="部门" align="center" show-overflow-tooltip />
              <el-table-column prop="phone" label="手机号" align="center" />
              <el-table-column prop="status" label="状态" align="center" width="80">
                <template #default="scope">
                  <el-tag
                    :type="scope.row.status === '0' ? 'success' : 'danger'"
                    effect="plain"
                    size="small"
                    disable-transitions
                  >
                    {{ scope.row.status === '0' ? '正常' : '停用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" align="center" min-width="160" show-overflow-tooltip />
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
      </div>
    </div>

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
              <el-input v-model="formData.username" placeholder="请输入用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="nickname" label="昵称">
              <el-input v-model="formData.nickname" placeholder="请输入昵称" />
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
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="phone" label="手机号">
              <el-input v-model="formData.phone" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="email" label="邮箱">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="sex" label="性别">
              <el-select v-model="formData.sex" placeholder="请选择性别" style="width: 100%">
                <el-option label="男" value="0" />
                <el-option label="女" value="1" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="status" label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio value="0">正常</el-radio>
                <el-radio value="1">停用</el-radio>
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
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateOrUpdate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { usePagination } from '@@/composables/usePagination'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'

defineOptions({
  name: 'user',
})

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref<boolean>(false)
const dialogVisible = ref<boolean>(false)

// 部门树
const deptTreeRef = useTemplateRef('deptTreeRef')
const deptFilterText = ref('')
const deptTreeData = ref<any[]>([])
const currentDeptId = ref<number | undefined>(undefined)

// 搜索
const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<any>({})

// 表格
const tableRef = useTemplateRef('tableRef')
const tableData = ref<any[]>([])

// 表单
const formRef = useTemplateRef('formRef')
const formData = ref<any>({ status: '0' })

const formRules: FormRules = {
  username: [{ required: true, trigger: 'blur', message: '请输入用户名' }],
  nickname: [{ required: true, trigger: 'blur', message: '请输入昵称' }],
  password: [
    { required: true, trigger: 'blur', message: '请输入密码' },
    { min: 8, max: 16, message: '长度在 8 到 16 个字符', trigger: 'blur' },
  ],
  deptId: [{ required: true, trigger: 'change', message: '请选择部门' }],
}

// 部门树过滤
watch(deptFilterText, (val) => {
  deptTreeRef.value?.filter(val)
})

function filterDeptNode(value: string, data: any) {
  if (!value) return true
  return data.deptName?.includes(value)
}

function handleDeptClick(data: any) {
  currentDeptId.value = data.id
  getTableData()
}

function getDeptTree() {
  // TODO: 对接部门树接口
  // deptTree().then(({ data }) => { deptTreeData.value = data })
}

function handleSearch() {
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  currentDeptId.value = undefined
  deptTreeRef.value?.setCurrentKey(undefined as any)
  getTableData()
}

function handleAdd() {
  dialogVisible.value = true
  formData.value = { status: '0' }
}

function handleModify(row: any) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
}

function handleClose() {
  formData.value = { status: '0' }
  formRef.value?.clearValidate()
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error('表单校验不通过')
      return
    }
    loading.value = true
    // TODO: 对接新增/修改接口
    // const api = formData.value.id === undefined ? addUser : modifyUserById
    // api(formData.value).then((data) => {
    //   ElMessage.success(data.msg || '操作成功')
    //   dialogVisible.value = false
    //   getTableData()
    // }).finally(() => { loading.value = false })
    loading.value = false
  })
}

function handleRemove(row: any) {
  ElMessageBox.confirm(`正在删除用户「${row.username}」，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // TODO: 对接删除接口
    // if (row.id) {
    //   removeUserByIds(String(row.id)).then((data) => {
    //     ElMessage.success(data.msg || '删除成功')
    //     getTableData()
    //   })
    // }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as any[]) || []
  if (selectedRows.length === 0) {
    ElMessage.error('请选择要删除的数据')
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(`正在删除${selectedRows.length}条用户数据，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // TODO: 对接批量删除接口
    // removeUserByIds(ids).then((data) => {
    //   ElMessage.success(data.msg || '删除成功')
    //   getTableData()
    // })
  })
}

function handleResetPwd(row: any) {
  ElMessageBox.confirm(`确认重置用户「${row.username}」的密码？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // TODO: 对接重置密码接口
    // resetUserPwd(row.id).then((data) => {
    //   ElMessage.success(data.msg || '重置成功')
    // })
  })
}

function getTableData() {
  loading.value = true
  const requestParam = {
    ...searchData,
    deptId: currentDeptId.value,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  // TODO: 对接用户分页接口
  // userPage(requestParam).then(({ data }) => {
  //   paginationData.total = data.total
  //   tableData.value = data.rows
  // }).catch(() => {
  //   tableData.value = []
  // }).finally(() => {
  //   loading.value = false
  // })
  loading.value = false
}

// 初始化
getDeptTree()

watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, {
  immediate: true,
})
</script>

<style lang="scss" scoped>
.user-layout {
  display: flex;
  gap: 16px;
}

.dept-card {
  width: 260px;
  flex-shrink: 0;

  .dept-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;

    .refresh-icon {
      cursor: pointer;
      font-size: 16px;
      color: #909399;
      transition: color 0.2s;
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  .dept-search {
    margin-bottom: 12px;
  }
}

.user-content {
  flex: 1;
  min-width: 0;
}

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
