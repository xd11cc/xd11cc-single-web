<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="module" :label="$t('system.operateLog.search.module')">
          <el-input v-model="searchData.module" :placeholder="$t('system.operateLog.formPlaceholder.module')" />
        </el-form-item>
        <el-form-item prop="operateType" :label="$t('system.operateLog.search.operateType')">
          <el-select v-model="searchData.operateType" :placeholder="$t('system.operateLog.formPlaceholder.operateType')" clearable style="width: 150px">
            <el-option
              v-for="item in getDictList('system_operate_type')"
              :key="item.id"
              :label="item.value"
              :value="item.label!"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="status" :label="$t('system.operateLog.search.status')">
          <el-select v-model="searchData.status" :placeholder="$t('system.operateLog.formPlaceholder.status')" clearable style="width: 150px">
            <el-option
              v-for="item in getDictList('system_operate_status')"
              :key="item.id"
              :label="item.value"
              :value="item.label!"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template>{{ $t('system.operateLog.actions.query') }}
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>{{ $t('system.operateLog.actions.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button
            type="danger"
            @click="handleBatchRemove"
            v-permission="['system:operateLog:delete']"
          >
            <template #icon><Icon icon="lucide:trash-2" /></template>
            {{ $t('system.operateLog.actions.batchDelete') }}
          </el-button>
          <el-button
            type="danger"
            plain
            @click="handleClean"
            v-permission="['system:operateLog:clean']"
          >
            <template #icon><Icon icon="lucide:trash" /></template>
            {{ $t('system.operateLog.actions.clean') }}
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="module" :label="$t('system.operateLog.columns.module')" align="center" />
          <el-table-column prop="operateType" :label="$t('system.operateLog.columns.operateType')" align="center" width="100">
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_operate_type', scope.row.operateType)?.listClass || 'info'"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{ getDictItem('system_operate_type', scope.row.operateType)?.value || scope.row.operateType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="requestMethod" :label="$t('system.operateLog.columns.requestMethod')" align="center" width="100" />
          <el-table-column prop="operateIp" :label="$t('system.operateLog.columns.operateIp')" align="center" width="140" />
          <el-table-column prop="status" :label="$t('system.operateLog.columns.status')" align="center" width="80">
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_operate_status', scope.row.status)?.listClass || 'info'"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{ getDictItem('system_operate_status', scope.row.status)?.value || scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="costTime" :label="$t('system.operateLog.columns.costTime')" align="center" width="100">
            <template #default="scope">
              {{ scope.row.costTime }}ms
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="$t('system.operateLog.columns.createTime')" align="center" min-width="160" />
          <el-table-column fixed="right" :label="$t('system.operateLog.columns.action')" width="90" align="center">
            <template #default="scope">
              <el-tooltip :content="$t('system.operateLog.actions.detail')" placement="top">
                <el-button
                  type="primary"
                  text
                  bg
                  size="small"
                  @click="handleDetail(scope.row)"
                >
                  <Icon icon="lucide:eye" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.operateLog.actions.delete')" placement="top">
                <el-button
                  type="danger"
                  text
                  bg
                  size="small"
                  @click="handleRemove(scope.row)"
                  v-permission="['system:operateLog:delete']"
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="$t('system.operateLog.dialogs.detail')" width="50%">
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="$t('system.operateLog.detail.module')">{{ detailData.module }}</el-descriptions-item>
        <el-descriptions-item :label="$t('system.operateLog.detail.operateType')">
          {{ getDictItem('system_operate_type', detailData.operateType)?.value || detailData.operateType }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('system.operateLog.detail.requestMethod')">{{ detailData.requestMethod }}</el-descriptions-item>
        <el-descriptions-item :label="$t('system.operateLog.detail.status')">
          <el-tag
            :type="getDictItem('system_operate_status', detailData.status)?.listClass || 'info'"
            effect="plain"
            size="small"
          >
            {{ getDictItem('system_operate_status', detailData.status)?.value || detailData.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('system.operateLog.detail.operateDesc')" :span="2">{{ detailData.operateDesc }}</el-descriptions-item>
        <el-descriptions-item :label="$t('system.operateLog.detail.requestUrl')" :span="2">{{ detailData.requestUrl }}</el-descriptions-item>
        <el-descriptions-item :label="$t('system.operateLog.detail.method')" :span="2">{{ detailData.method }}</el-descriptions-item>
        <el-descriptions-item :label="$t('system.operateLog.detail.operateIp')">{{ detailData.operateIp }}</el-descriptions-item>
        <el-descriptions-item :label="$t('system.operateLog.detail.costTime')">{{ detailData.costTime }}ms</el-descriptions-item>
        <el-descriptions-item :label="$t('system.operateLog.detail.requestParam')" :span="2">
          <el-input
            v-if="detailData.requestParam"
            type="textarea"
            :model-value="detailData.requestParam"
            readonly
            :autosize="{ minRows: 2, maxRows: 6 }"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('system.operateLog.detail.responseResult')" :span="2">
          <el-input
            v-if="detailData.responseResult"
            type="textarea"
            :model-value="detailData.responseResult"
            readonly
            :autosize="{ minRows: 2, maxRows: 6 }"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.errorMsg" :label="$t('system.operateLog.detail.errorMsg')" :span="2">
          <el-input
            type="textarea"
            :model-value="detailData.errorMsg"
            readonly
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </el-descriptions-item>
        <el-descriptions-item :label="$t('system.operateLog.detail.createTime')" :span="2">{{ detailData.createTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">{{ $t('common.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n"
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { usePagination } from '@@/composables/usePagination'
import { operateLogPage, removeOperateLogByIds, cleanOperateLog } from './apis'
import type { SystemOperateLogQueryVO, SystemOperateLogVO } from './apis/type'

const { t } = useI18n(); const $t = t

defineOptions({
  name: 'operateLog',
})

const { getDictList, getDictItem } = useDict(['system_operate_type', 'system_operate_status'])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemOperateLogQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<SystemOperateLogVO[]>([])

const detailVisible = ref(false)
const detailData = ref<SystemOperateLogVO>({})

function handleSearch() {
  paginationData.currentPage = 1
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  paginationData.currentPage = 1
  getTableData()
}

function handleDetail(row: SystemOperateLogVO) {
  detailData.value = row
  detailVisible.value = true
}

function handleRemove(row: SystemOperateLogVO) {
  ElMessageBox.confirm($t('system.operateLog.messages.deleteConfirm'), $t('common.messages.confirmTitle'), {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    type: 'warning',
  }).then(() => {
    if (row.id) {
      removeOperateLogByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || $t('system.operateLog.messages.deleteSuccess'))
        getTableData()
      })
    }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemOperateLogVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning($t('system.operateLog.messages.selectFirst'))
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm($t('system.operateLog.messages.batchDeleteConfirm', { count: selectedRows.length }), $t('common.messages.confirmTitle'), {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    type: 'warning',
  }).then(() => {
    removeOperateLogByIds(ids).then((data) => {
      ElMessage.success(data.msg || $t('system.operateLog.messages.deleteSuccess'))
      getTableData()
    })
  })
}

function handleClean() {
  ElMessageBox.confirm($t('system.operateLog.messages.cleanConfirm'), $t('common.messages.warningTitle'), {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    type: 'error',
  }).then(() => {
    cleanOperateLog().then(() => {
      ElMessage.success($t('system.operateLog.messages.cleanSuccess'))
      getTableData()
    })
  })
}

function getTableData() {
  loading.value = true
  const params = {
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  operateLogPage(params)
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
