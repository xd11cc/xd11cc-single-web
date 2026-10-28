<template>
  <div class="approval-page">
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline @submit.prevent>
        <el-form-item :label="$t('bpm.approval.todo.search.title')">
          <el-input
            v-model="query.title"
            clearable
            :placeholder="$t('bpm.approval.todo.placeholder.title')"
            class="search-field-xl"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="$t('bpm.approval.todo.search.processKey')">
          <el-input
            v-model="query.processDefinitionKey"
            clearable
            :placeholder="$t('bpm.approval.todo.placeholder.processKey')"
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
          :label="$t('bpm.approval.todo.columns.taskName')"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          prop="title"
          :label="$t('bpm.approval.todo.columns.title')"
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
          :label="$t('bpm.approval.todo.columns.processKey')"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.processDefinitionKey || '-' }}</template>
        </el-table-column>
        <el-table-column
          prop="businessKey"
          :label="$t('bpm.approval.todo.columns.businessKey')"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.businessKey || '-' }}</template>
        </el-table-column>
        <el-table-column
          prop="assignee"
          :label="$t('bpm.approval.todo.columns.assignee')"
          width="130"
          align="center"
        >
          <template #default="{ row }">
            <el-tag v-if="row.assignee" size="small" effect="plain">{{ row.assignee }}</el-tag>
            <el-tag v-else size="small" type="warning" effect="plain">
              {{ $t('bpm.approval.todo.candidate') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          :label="$t('bpm.approval.todo.columns.createTime')"
          width="170"
          align="center"
        />
        <el-table-column fixed="right" :label="$t('common.action')" width="130" align="center">
          <template #default="{ row }">
            <div class="action-icons">
              <el-tooltip
                :content="$t('bpm.approval.todo.actions.detail')"
                placement="top"
                :show-after="200"
              >
                <el-button circle size="small" @click="openDetail(row)">
                  <Icon icon="lucide:scroll-text" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                :content="$t('bpm.approval.todo.actions.approve')"
                placement="top"
                :show-after="200"
              >
                <el-button circle size="small" type="success" plain @click="openApprove(row)">
                  <Icon icon="lucide:check" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                :content="$t('bpm.approval.todo.actions.delegate')"
                placement="top"
                :show-after="200"
              >
                <el-button circle size="small" type="warning" plain @click="openDelegate(row)">
                  <Icon icon="lucide:arrow-right-left" />
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

    <!-- 审批详情（含通过 / 驳回） -->
    <ApprovalDetailDrawer
      v-model="detailVisible"
      :process-instance-id="activeProcessInstanceId"
      :task-id="activeTaskId"
      @approved="loadData"
      @rejected="loadData"
    />

    <!-- 快速通过 -->
    <el-dialog
      v-model="approveVisible"
      :title="$t('bpm.approval.todo.dialogs.approve')"
      width="520px"
      destroy-on-close
    >
      <el-form :model="approveForm" label-width="90px">
        <el-form-item :label="$t('bpm.approval.todo.columns.taskName')">
          <span>{{ currentTask?.taskName || '-' }}</span>
        </el-form-item>
        <el-form-item :label="$t('bpm.approval.form.comment')">
          <el-input
            v-model="approveForm.comment"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            :placeholder="$t('bpm.approval.placeholder.comment')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="success" :loading="submitLoading" @click="submitApprove">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 转办 -->
    <el-dialog
      v-model="delegateVisible"
      :title="$t('bpm.approval.todo.dialogs.delegate')"
      width="520px"
      destroy-on-close
    >
      <el-form :model="delegateForm" label-width="110px">
        <el-form-item :label="$t('bpm.approval.form.targetUser')" required>
          <el-input
            v-model="delegateForm.targetUserId"
            :placeholder="$t('bpm.approval.placeholder.targetUser')"
          />
          <div class="form-tip">{{ $t('bpm.approval.tips.targetUserId') }}</div>
        </el-form-item>
        <el-form-item :label="$t('bpm.approval.form.comment')">
          <el-input
            v-model="delegateForm.comment"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            :placeholder="$t('bpm.approval.placeholder.delegateComment')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="delegateVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="warning" :loading="submitLoading" @click="submitDelegate">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { approveTask, delegateTask, getMyTodoTasks } from '../apis'
import type { MyTaskQuery, WorkflowTaskVO } from '../apis/type'
import ApprovalDetailDrawer from '../components/ApprovalDetailDrawer.vue'

defineOptions({ name: 'bpmApprovalTodo' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitLoading = ref(false)
const total = ref(0)
const tableData = ref<WorkflowTaskVO[]>([])

const query = reactive<MyTaskQuery>({
  currentPage: 1,
  pageSize: 10,
  title: undefined,
  processDefinitionKey: undefined,
})

const currentTask = ref<WorkflowTaskVO | null>(null)

const detailVisible = ref(false)
const activeProcessInstanceId = ref('')
const activeTaskId = ref('')

const approveVisible = ref(false)
const approveForm = reactive({ comment: '' })

const delegateVisible = ref(false)
const delegateForm = reactive({ targetUserId: '', comment: '' })

async function loadData() {
  loading.value = true
  try {
    const { data } = await getMyTodoTasks(query)
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

/** 打开审批详情：携带 taskId 时会显示「通过 / 驳回」操作区 */
function openDetail(row: WorkflowTaskVO) {
  if (!row.processInstanceId) return
  activeProcessInstanceId.value = row.processInstanceId
  activeTaskId.value = row.taskId ?? ''
  detailVisible.value = true
}

function openApprove(row: WorkflowTaskVO) {
  currentTask.value = row
  approveForm.comment = ''
  approveVisible.value = true
}

function openDelegate(row: WorkflowTaskVO) {
  currentTask.value = row
  delegateForm.targetUserId = ''
  delegateForm.comment = ''
  delegateVisible.value = true
}

async function submitApprove() {
  if (!currentTask.value?.taskId) return
  submitLoading.value = true
  try {
    await approveTask({
      taskId: currentTask.value.taskId,
      comment: approveForm.comment || undefined,
    })
    ElMessage.success(t('common.messages.operationSuccess'))
    approveVisible.value = false
    await loadData()
  } finally {
    submitLoading.value = false
  }
}

async function submitDelegate() {
  if (!currentTask.value?.taskId) return
  if (!delegateForm.targetUserId) {
    ElMessage.warning(t('bpm.approval.messages.inputTargetUser'))
    return
  }
  submitLoading.value = true
  try {
    await delegateTask({
      taskId: currentTask.value.taskId,
      targetUserId: delegateForm.targetUserId.trim(),
      comment: delegateForm.comment || undefined,
    })
    ElMessage.success(t('common.messages.operationSuccess'))
    delegateVisible.value = false
    await loadData()
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  void loadData().then(() => openFromQuery())
})

/**
 * 支持从待办提醒弹窗 / 消息通知直达：
 * ?processInstanceId=xxx&taskId=xxx&approve=1
 */
function openFromQuery() {
  const { processInstanceId, taskId, approve } = route.query
  const instanceId = typeof processInstanceId === 'string' ? processInstanceId : ''
  if (!instanceId) return

  const targetTaskId = typeof taskId === 'string' ? taskId : ''
  // 在已加载列表中定位任务，拿到真实 taskId 才能展示审批操作区
  const matched =
    tableData.value.find((row) => row.taskId === targetTaskId) ??
    tableData.value.find((row) => row.processInstanceId === instanceId)

  activeProcessInstanceId.value = instanceId
  activeTaskId.value = targetTaskId || matched?.taskId || ''

  if (approve === '1' && matched) {
    currentTask.value = matched
    approveForm.comment = ''
    approveVisible.value = true
  } else {
    detailVisible.value = true
  }

  // 消费掉 query，避免刷新或返回时重复触发
  const rest = { ...route.query }
  delete rest.processInstanceId
  delete rest.taskId
  delete rest.approve
  void router.replace({ query: rest })
}
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
.form-tip {
  margin-top: var(--p-space-1);
  font-size: var(--p-text-sm);
  line-height: 1.4;
  color: var(--el-text-color-secondary);
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
