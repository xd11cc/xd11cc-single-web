<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="name" label="字典名称">
          <el-input v-model="searchData.name" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item prop="type" label="字典类型">
          <el-input v-model="searchData.type" placeholder="请输入字典类型" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch"> 查询 </el-button>
          <el-button :icon="Refresh" @click="resetSearch"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="dialogVisible = true">
            新增
          </el-button>
          <el-button type="danger" :icon="Delete" @click="handleBatchRemove">批量删除</el-button>
        </div>
        <div>
          <el-tooltip content="下载">
            <el-button type="primary" :icon="Download" circle />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="name" label="字典名称" align="center" />
          <el-table-column prop="type" label="字典类型" align="center" />
          <el-table-column prop="remark" label="备注" align="center" />
          <el-table-column prop="createTime" label="创建时间" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scpoe">
              <el-button type="primary" text bg size="small" @click="handleModify(scpoe.row)"
                >修改</el-button
              >
              <el-button type="danger" text bg size="small" @click="handleRemove(scpoe.row)"
                >删除</el-button
              >
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
    <!-- 新增、修改 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增字典' : '修改字典'"
      width="30%"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="left"
      >
        <el-form-item prop="name" label="字典名称">
          <el-input v-model="formData.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item prop="type" label="字典类型">
          <el-input v-model="formData.type" placeholder="请输入菜单类型" />
        </el-form-item>
        <el-form-item prop="remark" label="备注">
          <el-input type="textarea" v-model="formData.remark" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false"> 取消 </el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateOrUpdate">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { CirclePlus, Delete, Download, Refresh, Search } from '@element-plus/icons-vue'
import { usePagination } from '@/common/composables/usePagination'
import { page, add, modifyById, removeByIds } from './apis/index'
import type { SystemDictTypeQueryVO, SystemDictTypeDO } from './apis/type'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const searchData: SystemDictTypeQueryVO = reactive({})

const loading = ref<boolean>(false)

const dialogVisible = ref<boolean>(false)

const tableData = ref<SystemDictTypeDO[]>([])

const formData = ref<SystemDictTypeDO>({})

const formRef = useTemplateRef('formRef')

const searchFormRef = useTemplateRef('searchFormRef')

const tableRef = useTemplateRef('tableRef')

const formRules: FormRules<SystemDictTypeDO> = {
  name: [{ required: true, trigger: 'blur', message: '请输入字典名称' }],
  type: [{ required: true, trigger: 'blur', message: '请输入字典类型' }],
}

function handleSearch() {
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error('表单校验不通过')
      return
    }
    loading.value = true
    const api = formData.value.id === undefined ? add : modifyById
    api(formData.value)
      .then(async () => {
        ElMessage.success('操作成功')
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        loading.value = false
      })
  })
}

function handleClose() {
  formData.value = {}
  formRef.value?.clearValidate()
}

function handleModify(row: SystemDictTypeDO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
}

function handleRemove(row: SystemDictTypeDO) {
  ElMessageBox.confirm(`正在删除${row.name}字典类型，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    if (row.id) {
      removeByIds(String(row.id)).then(() => {
        ElMessage.success('删除成功')
        getTableData()
      })
    }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemDictTypeDO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.error('请选择要删除的数据')
  }

  const ids = selectedRows.map((row) => row.id).join(',')

  ElMessageBox.confirm(`正在删除${selectedRows.length}条字典类型，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    removeByIds(ids).then(() => {
      ElMessage.success('删除成功')
      getTableData()
    })
  })
}

function getTableData() {
  loading.value = true
  const requestParam = {
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  page(requestParam)
    .then(({ data }) => {
      paginationData.total = data.total
      tableData.value = data.rows
    })
    .catch(() => {
      tableData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

// 监听分页参数变化
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
</style>
