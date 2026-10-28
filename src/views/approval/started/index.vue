<template>
  <div class="approval-page">
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline @submit.prevent>
        <el-form-item :label="$t('bpm.approval.started.search.title')">
          <el-input
            v-model="query.title"
            clearable
            :placeholder="$t('bpm.approval.started.placeholder.title')"
            class="search-field-xl"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="$t('bpm.approval.started.search.status')">
          <el-select
            v-model="query.status"
            clearable
            :placeholder="$t('bpm.approval.started.placeholder.status')"
            class="search-field"
          >
            <el-option
              v-for="item in instanceStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template>
            {{ $t('common.search') }}
          </el-button>
          <el-button @click="handleReset">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>
            {{ $t('common.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table v-table-loading="loading" :data="tableData" border stripe>
        <el-table-column
          prop="title"
          :label="$t('bpm.approval.started.columns.title')"
          min-width="220"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="openDetail(row)">
              {{ row.title || '-' }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column
          prop="processDefinitionKey"
          :label="$t('bpm.approval.started.columns.processKey')"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          prop="businessKey"
          :label="$t('bpm.approval.started.columns.businessKey')"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          prop="status"
          :label="$t('bpm.approval.started.columns.status')"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="plain" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          :label="$t('bpm.approval.started.columns.createTime')"
          width="170"
          align="center"
        />
        <el-table-column
          prop="endTime"
          :label="$t('bpm.approval.started.columns.endTime')"
          width="170"
          align="center"
        >
          <template #default="{ row }">{{ row.endTime || '-' }}</template>
        </el-table-column>
        <el-table-column fixed="right" :label="$t('common.action')" width="110" align="center">
          <template #default="{ row }">
            <div class="action-icons">
              <el-tooltip
                :content="$t('bpm.approval.started.actions.detail')"
                placement="top"
                :show-after="200"
              >
                <el-button circle size="small" @click="openDetail(row)">
                  <Icon icon="lucide:scroll-text" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-if="canCancel(row)"
                :content="$t('bpm.approval.started.actions.cancel')"
                placement="top"
                :show-after="200"
              >
                <el-button circle size="small" type="danger" plain @click="handleCancel(row)">
                  <Icon icon="lucide:undo-2" />
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('common.messages.noData')" />
        </template>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.currentPage"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="loadData"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <ApprovalDetailDrawer v-model="detailVisible" :process-instance-id="activeProcessInstanceId" />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cancelProcess, getMyStartedProcesses } from '../apis'
import type { MyStartedQuery, WorkflowInstanceVO } from '../apis/type'
import ApprovalDetailDrawer from '../components/ApprovalDetailDrawer.vue'

defineOptions({ name: 'bpmApprovalStarted' })

const { t } = useI18n()

const loading = ref(false)
const total = ref(0)
const tableData = ref<WorkflowInstanceVO[]>([])

const query = reactive<MyStartedQuery>({
  currentPage: 1,
  pageSize: 10,
  title: undefined,
  status: undefined,
})

const detailVisible = ref(false)
const activeProcessInstanceId = ref('')

const instanceStatusOptions = computed(() => [
  { value: 0, label: t('bpm.approval.status.running') },
  { value: 1, label: t('bpm.approval.status.completed') },
  { value: 2, label: t('bpm.approval.status.cancelled') },
  { value: 3, label: t('bpm.approval.status.rejected') },
])

function statusLabel(status?: number) {
  return instanceStatusOptions.value.find((item) => item.value === status)?.label ?? '-'
}

function statusTagType(status?: number) {
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'info'
    case 3:
      return 'danger'
    default:
      return 'warning'
  }
}

/** 仅「进行中 / 已驳回」允许发起人撤回 */
function canCancel(row: WorkflowInstanceVO) {
  return row.status === 0 || row.status === 3
}

async function loadData() {
  loading.value = true
  try {
    const { data } = await getMyStartedProcesses(query)
    tableData.value = data?.rows ?? []
    total.value = data?.total ?? 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.currentPage = 1
  void loadData()
}

function handleReset() {
  query.title = undefined
  query.status = undefined
  query.currentPage = 1
  void loadData()
}

function handleSizeChange() {
  query.currentPage = 1
  void loadData()
}

function openDetail(row: WorkflowInstanceVO) {
  if (!row.processInstanceId) return
  activeProcessInstanceId.value = row.processInstanceId
  detailVisible.value = true
}

async function handleCancel(row: WorkflowInstanceVO) {
  if (!row.processInstanceId) return
  try {
    const { value } = await ElMessageBox.prompt(
      t('bpm.approval.started.messages.cancelReason'),
      t('common.messages.confirmTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        inputPlaceholder: t('bpm.approval.started.placeholder.cancelReason'),
      },
    )
    await cancelProcess(row.processInstanceId, value)
    ElMessage.success(t('common.messages.operationSuccess'))
    await loadData()
  } catch {
    // 用户取消或请求失败，交互层已提示
  }
}

onMounted(() => {
  void loadData()
})
</script>

<style lang="scss" scoped>
.approval-page {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-3);
  padding: var(--p-space-4);
}
.search-card :deep(.el-form-item) {
  margin-bottom: 0;
}
.table-card :deep(.el-card__body) {
  padding: 0;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: var(--p-space-3) var(--p-space-4);
}
.action-icons {
  display: inline-flex;
  gap: var(--p-space-1-5);
  align-items: center;
  justify-content: center;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}
</style>
