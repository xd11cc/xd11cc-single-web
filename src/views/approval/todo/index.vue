<template>
  <UseCrudView :slotProps="crud.slotProps" readonly :table-props="{ border: true, stripe: true }">
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item :label="$t('bpm.approval.todo.search.title')">
        <el-input
          v-model="searchData.title"
          clearable
          :placeholder="$t('bpm.approval.todo.placeholder.title')"
          class="search-field-xl"
        />
      </el-form-item>
      <el-form-item :label="$t('bpm.approval.todo.search.processKey')">
        <el-input
          v-model="searchData.processDefinitionKey"
          clearable
          :placeholder="$t('bpm.approval.todo.placeholder.processKey')"
          class="search-field-lg"
        />
      </el-form-item>
    </template>

    <!-- 表格列 -->
    <template #table>
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
    </template>

    <template #empty>
      <el-empty :description="$t('common.messages.noData')" />
    </template>

    <!-- 页面自有弹窗 / 抽屉：放进 #extra，保证壳只有一个根节点 -->
    <template #extra>
      <!-- 审批详情（含通过 / 驳回） -->
      <ApprovalDetailDrawer
        v-model="detailVisible"
        :process-instance-id="activeProcessInstanceId"
        :task-id="activeTaskId"
        @approved="crud.refresh()"
        @rejected="crud.refresh()"
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
          <el-button
            type="success"
            :loading="submitting && pendingAction === 'approve'"
            @click="submitApprove"
          >
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
          <el-button
            type="warning"
            :loading="submitting && pendingAction === 'delegate'"
            @click="submitDelegate"
          >
            {{ $t('common.confirm') }}
          </el-button>
        </template>
      </el-dialog>
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { getMyTodoTasks } from '../apis'
import { useApprovalActions } from '../composables/useApprovalActions'
import type { MyTaskQuery, WorkflowTaskVO } from '../apis/type'
import ApprovalDetailDrawer from '../components/ApprovalDetailDrawer.vue'

defineOptions({ name: 'ApprovalTodo' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// 待办任务：只读列表，操作是「详情 / 通过 / 转办」
const crud = useCrud<MyTaskQuery, WorkflowTaskVO>({
  pageApi: (query) => getMyTodoTasks(query),
})

const currentTask = ref<WorkflowTaskVO | null>(null)
const detailVisible = ref(false)
const activeProcessInstanceId = ref('')
const activeTaskId = ref('')

const approveVisible = ref(false)
const approveForm = reactive({ comment: '' })

const delegateVisible = ref(false)
const delegateForm = reactive({ targetUserId: '', comment: '' })

/** 携带 taskId 时会显示「通过 / 驳回」操作区 */
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

// 审批动作统一走 useApprovalActions：成功后由 onSuccess 决定关哪个弹窗并刷新列表
const { approve, delegate, submitting, pendingAction } = useApprovalActions({
  onSuccess: async (action) => {
    if (action === 'approve') approveVisible.value = false
    if (action === 'delegate') delegateVisible.value = false
    await crud.refresh()
  },
})

function submitApprove() {
  return approve({
    taskId: currentTask.value?.taskId ?? '',
    comment: approveForm.comment || undefined,
  })
}

function submitDelegate() {
  return delegate({
    taskId: currentTask.value?.taskId ?? '',
    targetUserId: delegateForm.targetUserId.trim(),
    comment: delegateForm.comment || undefined,
  })
}

/**
 * 支持从待办提醒弹窗 / 消息通知直达：
 * ?processInstanceId=xxx&taskId=xxx&approve=1
 * 必须等首次列表加载完成后才能定位任务，因此监听 loading 的 true→false。
 */
let hasLoaded = false
let deepLinkHandled = false
watch(
  () => crud.slotProps.tableLoading,
  (loading) => {
    if (loading) {
      hasLoaded = true
      return
    }
    if (!hasLoaded || deepLinkHandled) return
    deepLinkHandled = true
    openFromQuery()
  },
)

function openFromQuery() {
  const { processInstanceId, taskId, approve } = route.query
  const instanceId = typeof processInstanceId === 'string' ? processInstanceId : ''
  if (!instanceId) return

  const targetTaskId = typeof taskId === 'string' ? taskId : ''
  const rows = crud.slotProps.tableData as WorkflowTaskVO[]
  const matched =
    rows.find((row) => row.taskId === targetTaskId) ??
    rows.find((row) => row.processInstanceId === instanceId)

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
.action-icons {
  display: inline-flex;
  gap: var(--p-space-1-5);
  align-items: center;
  justify-content: center;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.form-tip {
  margin-top: var(--p-space-1);
  color: var(--el-text-color-secondary);
  font-size: var(--p-text-sm);
  line-height: 1.4;
}
</style>
