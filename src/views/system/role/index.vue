<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="roleName" label="角色名称">
          <el-input v-model="searchData.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item prop="roleCode" label="角色编码">
          <el-input v-model="searchData.roleCode" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select
            v-model="searchData.status"
            placeholder="角色状态"
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
            <template #icon><Icon icon="lucide:search" /></template>查询
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" @click="handleAdd" v-permission="['system:role:add']">
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            新增
          </el-button>
          <el-button type="danger" @click="handleBatchRemove" v-permission="['system:role:delete']">
            <template #icon><Icon icon="lucide:trash-2" /></template>
            批量删除
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="roleName" label="角色名称" align="center" />
          <el-table-column prop="roleCode" label="角色编码" align="center" />
          <el-table-column prop="status" label="状态" align="center" width="80">
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
          <el-table-column prop="remark" label="备注" align="center" />
          <el-table-column
            prop="createTime"
            label="创建时间"
            align="center"
            min-width="160"
           
          />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button
                type="warning"
                text
                bg
                size="small"
                @click="handleModify(scope.row)"
                v-permission="['system:role:update']"
              >修改</el-button>
              <el-button
                type="danger"
                text
                bg
                size="small"
                @click="handleRemove(scope.row)"
                v-permission="['system:role:delete']"
              >删除</el-button>
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
      :title="formData.id === undefined ? '新增角色' : '修改角色'"
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
            <el-form-item prop="roleName" label="角色名称">
              <el-input v-model="formData.roleName" placeholder="请输入角色名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="roleCode" label="角色编码">
              <el-input v-model="formData.roleCode" placeholder="请输入角色编码" />
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
            <el-form-item prop="menuIds" label="菜单权限">
              <el-tree
                ref="menuTreeRef"
                :data="menuTreeData"
                :props="{ label: 'menuName', children: 'children' }"
                node-key="id"
                show-checkbox
                check-strictly
                default-expand-all
                class="menu-tree"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="dataScope" label="数据权限">
              <el-select v-model="formData.dataScope" placeholder="请选择数据范围" style="width: 100%">
                <el-option
                  v-for="item in dataScopeOptions"
                  :key="item.label"
                  :label="item.value"
                  :value="item.label"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="formData.dataScope === '5'">
            <el-form-item label="部门权限">
              <el-tree
                ref="deptTreeRef"
                :data="deptTreeData"
                :props="{ label: 'deptName', children: 'children' }"
                node-key="id"
                show-checkbox
                check-strictly
                default-expand-all
                class="menu-tree"
              />
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
        <el-button type="primary" :loading="submitLoading" @click="handleCreateOrUpdate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { usePagination } from '@@/composables/usePagination'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { rolePage, addRole, modifyRoleById, removeRoleByIds, getRoleMenuIds, getRoleDeptIds } from './apis'
import type { SystemRoleVO, SystemRoleQueryVO } from './apis/type'
import { treeList } from '@/views/system/menu/apis'
import type { SystemMenuTreeVO } from '@/views/system/menu/apis/type'
import { deptTreeList } from '@/views/system/dept/apis'
import type { SystemDeptTreeVO } from '@/views/system/dept/apis/type'

defineOptions({
  name: 'role',
})

const { getDictList, getDictItem } = useDict(['system_status'])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemRoleQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<SystemRoleVO[]>([])

const formRef = useTemplateRef('formRef')
const menuTreeRef = useTemplateRef('menuTreeRef')
const deptTreeRef = useTemplateRef('deptTreeRef')
const formData = ref<any>({ status: '0', dataScope: '1' })

const menuTreeData = ref<SystemMenuTreeVO[]>([])
const deptTreeData = ref<SystemDeptTreeVO[]>([])

const dataScopeOptions = [
  { label: '1', value: '全部数据' },
  { label: '2', value: '本部门及下级部门' },
  { label: '3', value: '本部门数据' },
  { label: '4', value: '仅本人数据' },
  { label: '5', value: '自定义' },
]
const formRules: FormRules = {
  roleName: [{ required: true, trigger: 'blur', message: '请输入角色名称' }],
  roleCode: [{ required: true, trigger: 'blur', message: '请输入角色编码' }],
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
  formData.value = { status: '0', dataScope: '1' }
}

function handleModify(row: SystemRoleVO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
  if (!formData.value.dataScope) {
    formData.value.dataScope = '1'
  }
  nextTick(() => {
    menuTreeRef.value?.setCheckedKeys([])
    deptTreeRef.value?.setCheckedKeys([])
    if (row.id) {
      getRoleMenuIds(row.id).then(({ data }) => {
        data.forEach((id) => {
          menuTreeRef.value?.setChecked(id, true, false)
        })
      })
      if (formData.value.dataScope === '5') {
        getRoleDeptIds(row.id).then(({ data }) => {
          data.forEach((id) => {
            deptTreeRef.value?.setChecked(id, true, false)
          })
        })
      }
    }
  })
}

function handleClose() {
  formData.value = { status: '0', dataScope: '1' }
  formRef.value?.clearValidate()
  menuTreeRef.value?.setCheckedKeys([])
  deptTreeRef.value?.setCheckedKeys([])
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    submitLoading.value = true
    const checkedKeys = menuTreeRef.value?.getCheckedKeys(false) as number[]
    const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() as number[]
    const menuIds = [...(checkedKeys || []), ...(halfCheckedKeys || [])]

    const deptIds = formData.value.dataScope === '5'
      ? (deptTreeRef.value?.getCheckedKeys(false) as number[]) || []
      : []

    const isAdd = formData.value.id === undefined
    const api = isAdd
      ? addRole({ roleCode: formData.value.roleCode, roleName: formData.value.roleName, status: formData.value.status, dataScope: formData.value.dataScope, menuIds, deptIds, remark: formData.value.remark })
      : modifyRoleById({ id: formData.value.id, roleCode: formData.value.roleCode, roleName: formData.value.roleName, status: formData.value.status, dataScope: formData.value.dataScope, menuIds, deptIds, remark: formData.value.remark })

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

function handleRemove(row: SystemRoleVO) {
  ElMessageBox.confirm(`正在删除角色「${row.roleName}」，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeRoleByIds(String(row.id)).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      getTableData()
    })
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemRoleVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(`正在删除 ${selectedRows.length} 条角色数据，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeRoleByIds(ids).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      getTableData()
    })
  })
}

function getTableData() {
  loading.value = true
  const params: SystemRoleQueryVO = {
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  rolePage(params)
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

function getMenuTree() {
  treeList({}).then(({ data }) => {
    menuTreeData.value = data
  })
}

function getDeptTree() {
  deptTreeList({}).then(({ data }) => {
    deptTreeData.value = data
  })
}

getMenuTree()
getDeptTree()

watch(
  () => formData.value.dataScope,
  (val) => {
    if (val === '5' && formData.value.id && dialogVisible.value) {
      nextTick(() => {
        deptTreeRef.value?.setCheckedKeys([])
        getRoleDeptIds(formData.value.id).then(({ data }) => {
          data.forEach((id) => {
            deptTreeRef.value?.setChecked(id, true, false)
          })
        })
      })
    }
  },
)

watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, {
  immediate: true,
})
</script>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 20px;
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

.menu-tree {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
