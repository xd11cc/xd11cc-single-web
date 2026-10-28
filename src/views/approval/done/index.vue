<template>
  <div class="approval-page">
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline @submit.prevent>
        <el-form-item :label="$t('bpm.approval.done.search.title')">
          <el-input
            v-model="query.title"
            clearable
            :placeholder="$t('bpm.approval.done.placeholder.title')"
            class="search-field-xl"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="$t('bpm.approval.done.search.processKey')">
          <el-input
            v-model="query.processDefinitionKey"
            clearable
            :placeholder="$t('bpm.approval.done.placeholder.processKey')"
            class="search-field-lg"
            @keyup.enter="handleSearch"
          />
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
          prop="taskName"
          :label="$t('bpm.approval.done.columns.taskName')"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          prop="title"
          :label="$t('bpm.approval.done.columns.title')"
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
          :label="$t('bpm.approval.done.columns.processKey')"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.processDefinitionKey || '-' }}</template>
        </el-table-column>
        <el-table-column
          prop="businessKey"
          :label="$t('bpm.approval.done.columns.businessKey')"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.businessKey || '-' }}</template>
        </el-table-column>
        <el-table-column
          prop="comment"
          :label="$t('bpm.approval.done.columns.comment')"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.comment || '-' }}</template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          :label="$t('bpm.approval.done.columns.createTime')"
          width="170"
          align="center"
        />
        <el-table-column
          prop="endTime"
          :label="$t('bpm.approval.done.columns.endTime')"
          width="170"
          align="center"
        >
          <template #default="{ row }">{{ row.endTime || '-' }}</template>
        </el-table-column>
        <el-table-column fixed="right" :label="$t('common.action')" width="90" align="center">
          <template #default="{ row }">
            <div class="action-icons">
              <el-tooltip
                :content="$t('bpm.approval.done.actions.detail')"
                placement="top"
                :show-after="200"
              >
                <el-button circle size="small" @click="openDetail(row)">
                  <Icon icon="lucide:scroll-text" />
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
import { getMyDoneTasks } from '../apis'
import type { MyTaskQuery, WorkflowTaskVO } from '../apis/type'
import ApprovalDetailDrawer from '../components/ApprovalDetailDrawer.vue'

defineOptions({ name: 'bpmApprovalDone' })

const { t } = useI18n()

const loading = ref(false)
const total = ref(0)
const tableData = ref<WorkflowTaskVO[]>([])

const query = reactive<MyTaskQuery>({
  currentPage: 1,
  pageSize: 10,
  title: undefined,
  processDefinitionKey: undefined,
})

const detailVisible = ref(false)
const activeProcessInstanceId = ref('')

async function loadData() {
  loading.value = true
  try {
    const { data } = await getMyDoneTasks(query)
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
  query.processDefinitionKey = undefined
  query.currentPage = 1
  void loadData()
}

function handleSizeChange() {
  query.currentPage = 1
  void loadData()
}

function openDetail(row: WorkflowTaskVO) {
  if (!row.processInstanceId) return
  activeProcessInstanceId.value = row.processInstanceId
  detailVisible.value = true
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
}
</style>
