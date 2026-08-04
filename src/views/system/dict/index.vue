<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="dictName" :label="$t('system.dict.search.dictName')">
          <el-input
            v-model="searchData.dictName"
            :placeholder="$t('system.dict.formPlaceholder.dictName')"
          />
        </el-form-item>
        <el-form-item prop="dictType" :label="$t('system.dict.search.dictType')">
          <el-input
            v-model="searchData.dictType"
            :placeholder="$t('system.dict.formPlaceholder.dictType')"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template
            >{{ $t('system.dict.actions.query') }}</el-button
          >
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template
            >{{ $t('system.dict.actions.reset') }}</el-button
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
            v-permission="['system:dictType:add']"
          >
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            {{ $t('system.dict.actions.add') }}
          </el-button>
          <el-button
            type="danger"
            @click="handleBatchRemove"
            v-permission="['system:dictType:delete']"
          >
            <template #icon><Icon icon="lucide:trash-2" /></template>
            {{ $t('system.dict.actions.batchDelete') }}
          </el-button>
        </div>
        <div>
          <el-tooltip :content="$t('system.dict.actions.exportTitle')">
            <el-button type="primary" circle v-permission="['system:dictType:export']">
              <template #icon><Icon icon="lucide:download" /></template>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column
            prop="dictName"
            :label="$t('system.dict.search.dictName')"
            align="center"
          />
          <el-table-column
            prop="dictType"
            :label="$t('system.dict.search.dictType')"
            align="center"
          >
            <template #default="scope">
              <router-link
                :to="{ path: '/system/dict-data', query: { dictType: scope.row.dictType } }"
                class="link-type"
              >
                <span>{{ scope.row.dictType }}</span>
              </router-link>
            </template>
          </el-table-column>
          <el-table-column prop="remark" :label="$t('system.dict.columns.remark')" align="center" />
          <el-table-column
            prop="createTime"
            :label="$t('system.dict.columns.createTime')"
            align="center"
          />
          <el-table-column
            fixed="right"
            :label="$t('system.dict.columns.action')"
            width="90"
            align="center"
          >
            <template #default="scope">
              <el-tooltip :content="$t('system.dict.actions.edit')" placement="top">
                <el-button
                  type="warning"
                  text
                  bg
                  size="small"
                  @click="handleModify(scope.row)"
                  v-permission="['system:dictType:update']"
                >
                  <Icon icon="lucide:pencil" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.dict.actions.delete')" placement="top">
                <el-button
                  type="danger"
                  text
                  bg
                  size="small"
                  @click="handleRemove(scope.row)"
                  v-permission="['system:dictType:delete']"
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
        formData.id === undefined ? $t('system.dict.dialogs.add') : $t('system.dict.dialogs.edit')
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
        <el-form-item prop="dictName" :label="$t('system.dict.search.dictName')">
          <el-input
            v-model="formData.dictName"
            :placeholder="$t('system.dict.formPlaceholder.dictName')"
          />
        </el-form-item>
        <el-form-item prop="dictType" :label="$t('system.dict.search.dictType')">
          <el-input
            v-model="formData.dictType"
            :placeholder="$t('system.dict.formPlaceholder.dictType')"
          />
        </el-form-item>
        <el-form-item prop="remark" :label="$t('system.dict.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.dict.formPlaceholder.remark')"
            autosize
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateOrUpdate">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { usePagination } from '@@/composables/usePagination'
import { dictTypePage, addDictType, modifyDictTypeById, removeDictTypeByIds } from './apis/index'
import type { SystemDictTypeQueryVO, SystemDictTypeVO } from './apis/type'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'

const { t } = useI18n()
const $t = t

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
  dictName: [
    { required: true, trigger: 'blur', message: () => $t('system.dict.formPlaceholder.dictName') },
  ],
  dictType: [
    { required: true, trigger: 'blur', message: () => $t('system.dict.formPlaceholder.dictType') },
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
      ElMessage.error($t('system.dict.messages.formError'))
      return
    }
    loading.value = true
    const api = formData.value.id === undefined ? addDictType : modifyDictTypeById
    api(formData.value)
      .then((data) => {
        ElMessage.success(data.msg || $t('system.dict.messages.operationSuccess'))
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
  ElMessageBox.confirm(
    $t('system.dict.messages.deleteConfirm', { dictName: row.dictName }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    if (row.id) {
      removeDictTypeByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || $t('system.dict.messages.deleteSuccess'))
        getTableData()
      })
    }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemDictTypeVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.error($t('system.dict.messages.selectFirst'))
    return
  }

  const ids = selectedRows.map((row) => row.id).join(',')

  ElMessageBox.confirm(
    $t('system.dict.messages.batchDeleteConfirm', { count: selectedRows.length }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    removeDictTypeByIds(ids).then((data) => {
      ElMessage.success(data.msg || $t('system.dict.messages.deleteSuccess'))
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
