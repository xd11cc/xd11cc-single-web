<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="dictName" label="字典名称">
          <el-input v-model="searchData.dictName" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item prop="dictType" label="字典类型">
          <el-input v-model="searchData.dictType" placeholder="请输入字典类型" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template> 查询 </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template> 重置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button
            type="primary"
            @click="dialogVisible = true"
            v-permission="['system:dictType:add']"
          >
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            新增
          </el-button>
          <el-button
            type="danger"
            @click="handleBatchRemove"
            v-permission="['system:dictType:delete']"
          >
            <template #icon><Icon icon="lucide:trash-2" /></template>
            批量删除
          </el-button>
        </div>
        <div>
          <el-tooltip content="下载">
            <el-button
              type="primary"
              circle
              v-permission="['system:dictType:export']"
            >
              <template #icon><Icon icon="lucide:download" /></template>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="dictName" label="字典名称" align="center" />
          <el-table-column prop="dictType" label="字典类型" align="center">
            <template #default="scope">
              <router-link
                :to="{ path: '/system/dict-data', query: { dictType: scope.row.dictType } }"
                class="link-type"
              >
                <span>{{ scope.row.dictType }}</span>
              </router-link>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" align="center" />
          <el-table-column prop="createTime" label="创建时间" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button
                type="primary"
                text
                bg
                size="small"
                @click="handleModify(scope.row)"
                v-permission="['system:dictType:update']"
                >修改</el-button
              >
              <el-button
                type="danger"
                text
                bg
                size="small"
                @click="handleRemove(scope.row)"
                v-permission="['system:dictType:delete']"
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
      :title="formData.id === undefined ? '新增字典类型' : '修改字典类型'"
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
        <el-form-item prop="dictName" label="字典名称">
          <el-input v-model="formData.dictName" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item prop="dictType" label="字典类型">
          <el-input v-model="formData.dictType" placeholder="请输入字典类型" />
        </el-form-item>
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
import { Icon } from '@iconify/vue'
import { usePagination } from '@@/composables/usePagination'
import { dictTypePage, addDictType, modifyDictTypeById, removeDictTypeByIds } from './apis/index'
import type { SystemDictTypeQueryVO, SystemDictTypeVO } from './apis/type'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'

defineOptions({
  name: 'dictType',
})

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const searchData: SystemDictTypeQueryVO = reactive({})

const loading = ref<boolean>(false)

const dialogVisible = ref<boolean>(false)

const tableData = ref<SystemDictTypeVO[]>([])

const formData = ref<SystemDictTypeVO>({})

const formRef = useTemplateRef('formRef')

const searchFormRef = useTemplateRef('searchFormRef')

const tableRef = useTemplateRef('tableRef')

const formRules: FormRules<SystemDictTypeVO> = {
  dictName: [{ required: true, trigger: 'blur', message: '请输入字典名称' }],
  dictType: [{ required: true, trigger: 'blur', message: '请输入字典类型' }],
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
    const api = formData.value.id === undefined ? addDictType : modifyDictTypeById
    api(formData.value)
      .then((data) => {
        ElMessage.success(data.msg || '操作成功')
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

function handleModify(row: SystemDictTypeVO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
}

function handleRemove(row: SystemDictTypeVO) {
  ElMessageBox.confirm(`正在删除${row.dictName}字典类型，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    if (row.id) {
      removeDictTypeByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || '删除成功')
        getTableData()
      })
    }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemDictTypeVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.error('请选择要删除的数据')
    return
  }

  const ids = selectedRows.map((row) => row.id).join(',')

  ElMessageBox.confirm(`正在删除${selectedRows.length}条字典类型，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeDictTypeByIds(ids).then((data) => {
      ElMessage.success(data.msg || '删除成功')
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
  dictTypePage(requestParam)
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
