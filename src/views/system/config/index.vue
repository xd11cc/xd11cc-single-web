<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="configName" :label="$t('system.config.search.configName')">
          <el-input
            v-model="searchData.configName"
            :placeholder="$t('system.config.formPlaceholder.configName')"
          />
        </el-form-item>
        <el-form-item prop="configKey" :label="$t('system.config.search.configKey')">
          <el-input
            v-model="searchData.configKey"
            :placeholder="$t('system.config.formPlaceholder.configKey')"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template
            >{{ $t('system.config.actions.query') }}</el-button
          >
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template
            >{{ $t('system.config.actions.reset') }}</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button
            type="primary"
            @click="dialogVisible = true"
            v-permission="['system:config:add']"
          >
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            {{ $t('system.config.actions.add') }}
          </el-button>
          <el-button
            type="danger"
            @click="handleBatchRemove"
            v-permission="['system:config:delete']"
          >
            <template #icon><Icon icon="lucide:trash-2" /></template>
            {{ $t('system.config.actions.batchDelete') }}
          </el-button>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column
            prop="configName"
            :label="$t('system.config.columns.configName')"
            align="center"
          />
          <el-table-column
            prop="configKey"
            :label="$t('system.config.columns.configKey')"
            align="center"
          />
          <el-table-column
            prop="configValue"
            :label="$t('system.config.columns.configValue')"
            align="center"
          />
          <el-table-column
            prop="remark"
            :label="$t('system.config.columns.remark')"
            align="center"
          />
          <el-table-column
            prop="createTime"
            :label="$t('system.config.columns.createTime')"
            align="center"
            min-width="160"
          />
          <el-table-column
            fixed="right"
            :label="$t('system.config.columns.action')"
            width="90"
            align="center"
          >
            <template #default="scope">
              <el-tooltip :content="$t('system.config.actions.edit')" placement="top">
                <el-button
                  type="warning"
                  text
                  bg
                  size="small"
                  @click="handleModify(scope.row)"
                  v-permission="['system:config:update']"
                >
                  <Icon icon="lucide:pencil" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.config.actions.delete')" placement="top">
                <el-button
                  type="danger"
                  text
                  bg
                  size="small"
                  @click="handleRemove(scope.row)"
                  v-permission="['system:config:delete']"
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
    <!-- 新增、修改 -->
    <el-dialog
      v-model="dialogVisible"
      :title="
        formData.id === undefined
          ? $t('system.config.dialogs.add')
          : $t('system.config.dialogs.edit')
      "
      width="min(600px, calc(100vw - 32px))"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        class="adaptive-form"
        :model="formData"
        :rules="formRules"
        label-width="144px"
        label-position="left"
      >
        <el-form-item prop="configName" :label="$t('system.config.search.configName')">
          <el-input
            v-model="formData.configName"
            :placeholder="$t('system.config.formPlaceholder.configName')"
          />
        </el-form-item>
        <el-form-item prop="configKey" :label="$t('system.config.search.configKey')">
          <el-input
            v-model="formData.configKey"
            :placeholder="$t('system.config.formPlaceholder.configKey')"
          />
        </el-form-item>
        <el-form-item prop="configValue" :label="$t('system.config.form.configValue')">
          <el-input
            v-model="formData.configValue"
            :placeholder="$t('system.config.formPlaceholder.configValue')"
          />
        </el-form-item>
        <el-form-item prop="remark" :label="$t('system.config.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.config.formPlaceholder.remark')"
            autosize
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateOrUpdate">{{
          $t('common.confirm')
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { usePagination } from '@@/composables/usePagination'
import { configPage, addConfig, modifyConfigById, removeConfigByIds } from './apis'
import type { SystemConfigQueryVO, SystemConfigVO } from './apis/type'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'config',
})

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const searchData: SystemConfigQueryVO = reactive({})

const loading = ref<boolean>(false)

const dialogVisible = ref<boolean>(false)

const tableData = ref<SystemConfigVO[]>([])

const formData = ref<SystemConfigVO>({})

const formRef = useTemplateRef('formRef')

const searchFormRef = useTemplateRef('searchFormRef')

const tableRef = useTemplateRef('tableRef')

const formRules: FormRules<SystemConfigVO> = {
  configName: [
    {
      required: true,
      trigger: 'blur',
      message: () => $t('system.config.formPlaceholder.configName'),
    },
  ],
  configKey: [
    {
      required: true,
      trigger: 'blur',
      message: () => $t('system.config.formPlaceholder.configKey'),
    },
  ],
  configValue: [
    {
      required: true,
      trigger: 'blur',
      message: () => $t('system.config.formPlaceholder.configValue'),
    },
  ],
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
      ElMessage.error($t('system.config.messages.formError'))
      return
    }
    loading.value = true
    const api = formData.value.id === undefined ? addConfig : modifyConfigById
    api(formData.value)
      .then((data) => {
        ElMessage.success(data.msg || $t('system.config.messages.operationSuccess'))
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

function handleModify(row: SystemConfigVO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
}

function handleRemove(row: SystemConfigVO) {
  ElMessageBox.confirm(
    $t('system.config.messages.deleteConfirm', { configName: row.configName }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    if (row.id) {
      removeConfigByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || $t('system.config.messages.deleteSuccess'))
        getTableData()
      })
    }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemConfigVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.error($t('system.config.messages.selectFirst'))
    return
  }

  const ids = selectedRows.map((row) => row.id).join(',')

  ElMessageBox.confirm(
    $t('system.config.messages.batchDeleteConfirm', { count: selectedRows.length }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    removeConfigByIds(ids).then((data) => {
      ElMessage.success(data.msg || $t('system.config.messages.deleteSuccess'))
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
  configPage(requestParam)
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
