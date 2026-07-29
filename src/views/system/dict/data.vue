<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="dictType" :label="$t('system.dict.data.search.dictType')">
          <el-select
            v-model="searchData.dictType"
            :placeholder="$t('system.dict.data.search.dictTypePlaceholder')"
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
        <el-form-item prop="label" :label="$t('system.dict.data.search.label')">
          <el-input v-model="searchData.label" :placeholder="$t('system.dict.data.formPlaceholder.label')" />
        </el-form-item>
        <el-form-item prop="value" :label="$t('system.dict.data.search.value')">
          <el-input v-model="searchData.value" :placeholder="$t('system.dict.data.formPlaceholder.value')" />
        </el-form-item>
        <el-form-item prop="status" :label="$t('system.dict.data.search.status')">
          <el-select
            v-model="searchData.status"
            :placeholder="$t('system.dict.data.search.statusPlaceholder')"
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
            <template #icon><Icon icon="lucide:search" /></template>{{ $t('common.search') }}</el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>{{ $t('common.reset') }}</el-button>
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
            {{ $t('system.dict.data.actions.addData') }}
          </el-button>
          <el-button
            type="danger"
            @click="handleBatchRemove"
            v-permission="['system:dictData:delete']"
          >
            <template #icon><Icon icon="lucide:trash-2" /></template>
            {{ $t('system.dict.data.actions.batchDelete') }}
          </el-button>
        </div>
        <div>
          <el-tooltip :content="$t('system.dict.data.actions.exportTitle')">
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
          <el-table-column prop="label" :label="$t('system.dict.data.columns.label')" align="center" />
          <el-table-column prop="value" :label="$t('system.dict.data.columns.value')" align="center" />
          <el-table-column prop="sort" :label="$t('system.dict.data.columns.sort')" align="center" />
          <el-table-column prop="status" :label="$t('system.dict.data.columns.status')" align="center">
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
          <el-table-column prop="remark" :label="$t('system.dict.data.columns.remark')" align="center" />
          <el-table-column prop="createTime" :label="$t('system.dict.data.columns.createTime')" align="center" min-width="160" />
          <el-table-column fixed="right" :label="$t('system.dict.data.columns.action')" width="90" align="center">
            <template #default="scope">
              <el-tooltip :content="$t('common.edit')" placement="top">
                <el-button
                  type="warning"
                  text
                  bg
                  size="small"
                  @click="handleModify(scope.row)"
                  v-permission="['system:dictData:update']"
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
                  v-permission="['system:dictData:delete']"
                >
                  <Icon icon="lucide:trash-2" />
                </el-button>
              </el-tooltip>
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
      :title="formData.id === undefined ? $t('system.dict.data.dialogs.addData') : $t('system.dict.data.dialogs.editData')"
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
        <el-form-item prop="dictType" :label="$t('system.dict.data.form.dictType')">
          <el-input v-model="formData.dictType" disabled />
        </el-form-item>
        <el-form-item prop="label" :label="$t('system.dict.data.form.label')">
          <el-input v-model="formData.label" :placeholder="$t('system.dict.data.formPlaceholder.label')" />
        </el-form-item>
        <el-form-item prop="value" :label="$t('system.dict.data.form.value')">
          <el-input v-model="formData.value" :placeholder="$t('system.dict.data.formPlaceholder.value')" />
        </el-form-item>
        <el-form-item prop="cssClass" :label="$t('system.dict.data.form.cssClass')">
          <el-input v-model="formData.cssClass" :placeholder="$t('system.dict.data.formPlaceholder.cssClass')" />
        </el-form-item>
        <el-form-item prop="listClass" :label="$t('system.dict.data.form.listClass')">
          <el-select v-model="formData.listClass" style="width: 150px">
            <el-option
              v-for="item in listOption"
              :key="item.value"
              :label="item.label + '(' + item.value + ')'"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="sort" :label="$t('system.dict.data.form.sort')">
          <el-input-number v-model="formData.sort" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item prop="status" :label="$t('system.dict.data.form.status')">
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
        <el-form-item prop="remark" :label="$t('system.dict.data.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.dict.data.formPlaceholder.remark')"
            autosize
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateOrUpdate">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n"
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

const { t } = useI18n(); const $t = t

defineOptions({
  name: 'dictData',
})

const { loading, getDictItem, getDictList } = useDict(['system_status'])

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
  label: [{ required: true, trigger: 'blur', message: () => $t('system.dict.data.formPlaceholder.label') }],
  value: [{ required: true, trigger: 'blur', message: () => $t('system.dict.data.formPlaceholder.value') }],
}

const listOption = reactive([
  { value: 'primary', label: $t('system.dict.data.listClass.primary') },
  { value: 'success', label: $t('system.dict.data.listClass.success') },
  { value: 'info', label: $t('system.dict.data.listClass.info') },
  { value: 'warning', label: $t('system.dict.data.listClass.warning') },
  { value: 'danger', label: $t('system.dict.data.listClass.danger') },
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
    ElMessage.error($t('common.messages.selectFirst'))
    return
  }

  const ids = selectedRows.map((row) => row.id).join(',')

  ElMessageBox.confirm($t('system.dict.data.messages.batchDeleteConfirm', { count: selectedRows.length }), $t('common.messages.confirmTitle'), {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    type: 'warning',
  }).then(() => {
    removeDictDataByIds(ids).then((data) => {
      ElMessage.success(data.msg || $t('common.messages.deleteSuccess'))
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
      ElMessage.error($t('system.dict.data.messages.formError'))
      return
    }
    loading.value = true
    const api = formData.value.id === undefined ? addDictData : modifyDictDataById
    api(formData.value)
      .then((data) => {
        ElMessage.success(data.msg || $t('common.messages.operationSuccess'))
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        loading.value = false
      })
  })
}

function handleRemove(row: SystemDictDataVO) {
  ElMessageBox.confirm($t('system.dict.data.messages.deleteConfirm', { value: row.value }), $t('common.messages.confirmTitle'), {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    type: 'warning',
  }).then(() => {
    if (row.id) {
      removeDictDataByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || $t('common.messages.deleteSuccess'))
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
