<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="dictType" label="字典类型">
          <el-select
            v-model="searchData.dictType"
            placeholder="字典类型"
            style="width: 200px"
            @change="getTableData"
          >
            <el-option
              v-for="item in dictTypeOptions"
              :key="item.id"
              :label="item.dictName"
              :value="item.dictType!"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="label" label="字典标签">
          <el-input v-model="searchData.label" placeholder="请输入字典标签" />
        </el-form-item>
        <el-form-item prop="value" label="字典键值">
          <el-input v-model="searchData.value" placeholder="请输入字典键值" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select
            v-model="searchData.status"
            placeholder="数据状态"
            clearable
            style="width: 200px"
            @change="getTableData"
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
            @click="dialogVisible = true"
            v-permission="['system:dictData:add']"
          >
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            新增
          </el-button>
          <el-button
            type="danger"
            @click="handleBatchRemove"
            v-permission="['system:dictData:delete']"
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
              v-permission="['system:dictData:export']"
            >
              <template #icon><Icon icon="lucide:download" /></template>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="label" label="字典标签" align="center" />
          <el-table-column prop="value" label="字典键值" align="center" />
          <el-table-column prop="sort" label="排序" align="center" />
          <el-table-column prop="status" label="状态" align="center">
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_status', scope.row.status)?.listClass || 'info'"
                effect="plain"
                disable-transitions
              >
                {{ getDictItem('system_status', scope.row.status)?.value }}
              </el-tag>
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
                v-permission="['system:dictData:update']"
                >修改</el-button
              >
              <el-button
                type="danger"
                text
                bg
                size="small"
                @click="handleRemove(scope.row)"
                v-permission="['system:dictData:delete']"
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
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增字典数据' : '修改字典数据'"
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
        <el-form-item prop="dictType" label="字典类型">
          <el-input v-model="formData.dictType" disabled />
        </el-form-item>
        <el-form-item prop="label" label="字典标签">
          <el-input v-model="formData.label" placeholder="请输入字典标签" />
        </el-form-item>
        <el-form-item prop="value" label="字典键值">
          <el-input v-model="formData.value" placeholder="请输入字典键值" />
        </el-form-item>
        <el-form-item prop="cssClass" label="样式属性">
          <el-input v-model="formData.cssClass" placeholder="请输入样式属性" />
        </el-form-item>
        <el-form-item prop="listClass" label="回显样式">
          <el-select v-model="formData.listClass" style="width: 150px">
            <el-option
              v-for="item in listOption"
              :key="item.value"
              :label="item.label + '(' + item.value + ')'"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="sort" label="显示排序">
          <el-input-number v-model="formData.sort" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="remark" label="备注">
          <el-input
            type="textarea"
            v-model="formData.remark"
            placeholder="请输入备注"
            autosize
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
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
import { usePagination } from '@/common/composables/usePagination'
import type { SystemDictDataVO, SystemDictDataQueryVO, SystemDictTypeVO } from './apis/type'
import {
  addDictData,
  dictDataPage,
  modifyDictDataById,
  removeDictDataByIds,
  dictTypeList,
} from './apis'
import { cloneDeep } from 'lodash-es'
import type { FormRules } from 'element-plus'
import { useDict } from '@/common/composables/useDict'

defineOptions({
  name: 'dictData',
})

const { loading, getDictItem, getDictList } = useDict(['system_status', 'system_user_sex'])

const route = useRoute()

const dictType = route.query.dictType as string

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const searchFormRef = useTemplateRef('searchFormRef')

const tableRef = useTemplateRef('tableRef')

const formRef = useTemplateRef('formRef')

// const loading = ref<boolean>(false)

const dialogVisible = ref<boolean>(false)

const searchData: SystemDictDataQueryVO = reactive({
  dictType: dictType,
})

const tableData = ref<SystemDictDataVO[]>([])

const formData = ref<SystemDictDataVO>({
  dictType: dictType,
  sort: 0,
  status: '0',
  listClass: 'primary',
})

const dictTypeOptions = ref<SystemDictTypeVO[]>([])

const formRules: FormRules<SystemDictDataVO> = {
  label: [{ required: true, trigger: 'blur', message: '请输入字典标签' }],
  value: [{ required: true, trigger: 'blur', message: '请输入字典键值' }],
}

const listOption = reactive([
  { value: 'primary', label: '主要' },
  { value: 'success', label: '成功' },
  { value: 'info', label: '信息' },
  { value: 'warning', label: '警告' },
  { value: 'danger', label: '危险' },
])

function handleSearch() {
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemDictDataVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.error('请选择要删除的数据')
    return
  }

  const ids = selectedRows.map((row) => row.id).join(',')

  ElMessageBox.confirm(`正在删除${selectedRows.length}条字典数据，确认删除`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeDictDataByIds(ids).then((data) => {
      ElMessage.success(data.msg || '删除成功')
      getTableData()
    })
  })
}

function handleClose() {
  formData.value = {
    dictType: dictType,
    sort: 0,
    status: '0',
    listClass: 'primary',
  }
  formRef.value?.clearValidate()
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error('表单校验不通过')
      return
    }
    loading.value = true
    const api = formData.value.id === undefined ? addDictData : modifyDictDataById
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

function handleRemove(row: SystemDictDataVO) {
  ElMessageBox.confirm(`正在删除${row.value}字典数据，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    if (row.id) {
      removeDictDataByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || '删除成功')
        getTableData()
      })
    }
  })
}

function handleModify(row: SystemDictDataVO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
}

function getTableData() {
  loading.value = true
  const requestParam = {
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  dictDataPage(requestParam)
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

function getDictTypeList() {
  dictTypeList()
    .then(({ data }) => {
      dictTypeOptions.value = data
    })
    .catch(() => {
      dictTypeOptions.value = []
    })
}

onMounted(() => {
  getDictTypeList()
})

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
