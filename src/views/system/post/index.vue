<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="postCode" label="岗位编码">
          <el-input v-model="searchData.postCode" placeholder="请输入岗位编码" />
        </el-form-item>
        <el-form-item prop="postName" label="岗位名称">
          <el-input v-model="searchData.postName" placeholder="请输入岗位名称" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select v-model="searchData.status" placeholder="岗位状态" clearable style="width: 150px">
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
          <el-button type="primary" @click="handleAdd" v-permission="['system:post:add']">
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            新增
          </el-button>
          <el-button type="danger" @click="handleBatchRemove" v-permission="['system:post:delete']">
            <template #icon><Icon icon="lucide:trash-2" /></template>
            批量删除
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="postCode" label="岗位编码" align="center" show-overflow-tooltip />
          <el-table-column prop="postName" label="岗位名称" align="center" show-overflow-tooltip />
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
          <el-table-column prop="remark" label="备注" align="center" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" align="center" min-width="160" show-overflow-tooltip />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button
                type="warning"
                text
                bg
                size="small"
                @click="handleModify(scope.row)"
                v-permission="['system:post:update']"
              >修改</el-button>
              <el-button
                type="danger"
                text
                bg
                size="small"
                @click="handleRemove(scope.row)"
                v-permission="['system:post:delete']"
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
      :title="formData.id === undefined ? '新增岗位' : '修改岗位'"
      width="35%"
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
            <el-form-item prop="postName" label="岗位名称">
              <el-input v-model="formData.postName" placeholder="请输入岗位名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="postCode" label="岗位编码">
              <el-input v-model="formData.postCode" placeholder="请输入岗位编码" />
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
            <el-form-item prop="deptIds" label="所属部门">
              <el-tree
                ref="deptTreeRef"
                :data="deptTreeData"
                :props="{ label: 'deptName', children: 'children' }"
                node-key="id"
                show-checkbox
                default-expand-all
                class="dept-tree"
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
import { postPage, addPost, modifyPostById, removePostByIds, getPostDeptIds } from './apis'
import type { SystemPostVO, SystemPostQueryVO } from './apis/type'
import { deptTreeList } from '@/views/system/dept/apis'
import type { SystemDeptTreeVO } from '@/views/system/dept/apis/type'

defineOptions({
  name: 'post',
})

const { getDictList, getDictItem } = useDict(['system_status'])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemPostQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<SystemPostVO[]>([])

const formRef = useTemplateRef('formRef')
const deptTreeRef = useTemplateRef('deptTreeRef')
const formData = ref<any>({ status: '0' })

const deptTreeData = ref<SystemDeptTreeVO[]>([])

const formRules: FormRules = {
  postCode: [{ required: true, trigger: 'blur', message: '请输入岗位编码' }],
  postName: [{ required: true, trigger: 'blur', message: '请输入岗位名称' }],
  status: [{ required: true, trigger: 'change', message: '请选择状态' }],
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
  formData.value = { status: '0' }
}

function handleModify(row: SystemPostVO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
  nextTick(() => {
    deptTreeRef.value?.setCheckedKeys([])
    if (row.id) {
      getPostDeptIds(row.id).then(({ data }) => {
        data.forEach((id) => {
          deptTreeRef.value?.setChecked(id, true, false)
        })
      })
    }
  })
}

function handleClose() {
  formData.value = { status: '0' }
  formRef.value?.clearValidate()
  deptTreeRef.value?.setCheckedKeys([])
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    submitLoading.value = true
    const checkedKeys = deptTreeRef.value?.getCheckedKeys(false) as number[]
    const halfCheckedKeys = deptTreeRef.value?.getHalfCheckedKeys() as number[]
    const deptIds = [...(checkedKeys || []), ...(halfCheckedKeys || [])]

    const isAdd = formData.value.id === undefined
    const api = isAdd
      ? addPost({ postCode: formData.value.postCode, postName: formData.value.postName, status: formData.value.status, deptIds, remark: formData.value.remark })
      : modifyPostById({ id: formData.value.id, postCode: formData.value.postCode, postName: formData.value.postName, status: formData.value.status, deptIds, remark: formData.value.remark })

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

function handleRemove(row: SystemPostVO) {
  ElMessageBox.confirm(`正在删除岗位「${row.postName}」，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removePostByIds(String(row.id)).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      getTableData()
    })
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemPostVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(`正在删除 ${selectedRows.length} 条岗位数据，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removePostByIds(ids).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      getTableData()
    })
  })
}

function getTableData() {
  loading.value = true
  const params: SystemPostQueryVO = {
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  postPage(params)
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

function getDeptTree() {
  deptTreeList({}).then(({ data }) => {
    deptTreeData.value = data
  })
}

getDeptTree()

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

.dept-tree {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
