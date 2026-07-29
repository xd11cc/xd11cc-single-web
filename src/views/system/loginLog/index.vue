<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="username" :label="$t('system.loginLog.search.username')">
          <el-input
            v-model="searchData.username"
            :placeholder="$t('system.loginLog.formPlaceholder.username')"
          />
        </el-form-item>
        <el-form-item prop="loginType" :label="$t('system.loginLog.search.loginType')">
          <el-select
            v-model="searchData.loginType"
            :placeholder="$t('system.loginLog.formPlaceholder.loginType')"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in getDictList('system_login_type')"
              :key="item.id"
              :label="item.value"
              :value="item.label!"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="status" :label="$t('system.loginLog.search.status')">
          <el-select
            v-model="searchData.status"
            :placeholder="$t('system.loginLog.formPlaceholder.status')"
            clearable
            style="width: 150px"
          >
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
            <template #icon><Icon icon="lucide:search" /></template
            >{{ $t('system.loginLog.actions.query') }}
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template
            >{{ $t('system.loginLog.actions.reset') }}
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
            v-permission="['system:loginLog:delete']"
          >
            <template #icon><Icon icon="lucide:trash-2" /></template>
            {{ $t('system.loginLog.actions.batchDelete') }}
          </el-button>
          <el-button
            type="danger"
            plain
            @click="handleClean"
            v-permission="['system:loginLog:clean']"
          >
            <template #icon><Icon icon="lucide:trash" /></template>
            {{ $t('system.loginLog.actions.clean') }}
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column
            prop="username"
            :label="$t('system.loginLog.columns.username')"
            align="center"
          />
          <el-table-column
            prop="loginType"
            :label="$t('system.loginLog.columns.loginType')"
            align="center"
            width="100"
          >
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_login_type', scope.row.loginType)?.listClass || 'info'"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{
                  getDictItem('system_login_type', scope.row.loginType)?.value ||
                  scope.row.loginType
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            :label="$t('system.loginLog.columns.status')"
            align="center"
            width="80"
          >
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_operate_status', scope.row.status)?.listClass || 'info'"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{
                  getDictItem('system_operate_status', scope.row.status)?.value || scope.row.status
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="loginIp"
            :label="$t('system.loginLog.columns.loginIp')"
            align="center"
            width="140"
          />
          <el-table-column
            prop="browser"
            :label="$t('system.loginLog.columns.browser')"
            align="center"
          />
          <el-table-column prop="os" :label="$t('system.loginLog.columns.os')" align="center" />
          <el-table-column prop="msg" :label="$t('system.loginLog.columns.msg')" align="center" />
          <el-table-column
            prop="loginTime"
            :label="$t('system.loginLog.columns.loginTime')"
            align="center"
            min-width="160"
          />
          <el-table-column
            fixed="right"
            :label="$t('system.loginLog.columns.action')"
            width="70"
            align="center"
          >
            <template #default="scope">
              <el-tooltip :content="$t('system.loginLog.actions.delete')" placement="top">
                <el-button
                  type="danger"
                  text
                  bg
                  size="small"
                  @click="handleRemove(scope.row)"
                  v-permission="['system:loginLog:delete']"
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
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { usePagination } from '@@/composables/usePagination'
import { loginLogPage, removeLoginLogByIds, cleanLoginLog } from './apis'
import type { SystemLoginLogQueryVO, SystemLoginLogVO } from './apis/type'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'loginLog',
})

const { getDictList, getDictItem } = useDict(['system_login_type', 'system_operate_status'])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemLoginLogQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<SystemLoginLogVO[]>([])

function handleSearch() {
  paginationData.currentPage = 1
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  paginationData.currentPage = 1
  getTableData()
}

function handleRemove(row: SystemLoginLogVO) {
  ElMessageBox.confirm(
    $t('system.loginLog.messages.deleteConfirm'),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    if (row.id) {
      removeLoginLogByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || $t('system.loginLog.messages.deleteSuccess'))
        getTableData()
      })
    }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemLoginLogVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning($t('system.loginLog.messages.selectFirst'))
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(
    $t('system.loginLog.messages.batchDeleteConfirm', { count: selectedRows.length }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    removeLoginLogByIds(ids).then((data) => {
      ElMessage.success(data.msg || $t('system.loginLog.messages.deleteSuccess'))
      getTableData()
    })
  })
}

function handleClean() {
  ElMessageBox.confirm(
    $t('system.loginLog.messages.cleanConfirm'),
    $t('common.messages.warningTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'error',
    },
  ).then(() => {
    cleanLoginLog().then(() => {
      ElMessage.success($t('system.loginLog.messages.cleanSuccess'))
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
  loginLogPage(params)
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
