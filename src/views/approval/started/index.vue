<template>
  <UseCrudView :slotProps="crud.slotProps" readonly>
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item :label="$t('bpm.approval.started.search.title')">
        <el-input
          v-model="searchData.title"
          clearable
          :placeholder="$t('bpm.approval.started.placeholder.title')"
          class="search-field-xl"
        />
      </el-form-item>
      <el-form-item :label="$t('bpm.approval.started.search.status')">
        <el-select
          v-model="searchData.status"
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
    </template>

    <!-- 表格列 -->
    <template #table>
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
    </template>

    <template #empty>
      <el-empty :description="$t('common.messages.noData')" />
    </template>

    <!-- 页面自有弹窗 / 抽屉：放进 #extra，保证壳只有一个根节点 -->
    <template #extra>
      <!-- 流程详情抽屉 -->
      <ApprovalDetailDrawer
        v-model="detailVisible"
        :process-instance-id="activeProcessInstanceId"
      />
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { cancelProcess, getMyStartedProcesses } from '../apis'
import { useDict } from '@/common/composables/useDict'
import { INSTANCE_STATUS } from '../apis/type'
import type { InstanceStatus, MyStartedQuery, WorkflowInstanceVO } from '../apis/type'
import ApprovalDetailDrawer from '../components/ApprovalDetailDrawer.vue'

defineOptions({ name: 'ApprovalStarted' })

const { t } = useI18n()

// 我发起的：只读列表，操作是「查看详情 / 撤回」
const crud = useCrud<MyStartedQuery, WorkflowInstanceVO>({
  pageApi: (query) => getMyStartedProcesses(query),
})

const detailVisible = ref(false)
const activeProcessInstanceId = ref('')

// 后端 workflow_instance.status 是 char(2)，必须用字符串比较，
// 否则下拉筛选发出去的是数字，永远匹配不到数据
// 状态文案与标签色由字典 workflow_status 提供，与后端统一
const { getDictList: getStatusDictList, getDictItem: getStatusDictItem } = useDict([
  'workflow_status',
])

/** 状态下拉选项：label 存编码、value 存文案 */
const instanceStatusOptions = computed(() =>
  getStatusDictList('workflow_status').map((item) => ({
    // 后端 system_dict_data：label=展示文案、value=编码
    value: String(item.value),
    label: String(item.label),
  })),
)

function statusLabel(status?: InstanceStatus) {
  if (!status) return '-'
  return getStatusDictItem('workflow_status', status)?.label ?? status
}

function statusTagType(status?: InstanceStatus) {
  return getStatusDictItem('workflow_status', status ?? '')?.listClass ?? 'info'
}

/** 仅「进行中 / 已驳回」允许发起人撤回（状态为字符串，不能与数字比较） */
function canCancel(row: WorkflowInstanceVO) {
  return row.status === INSTANCE_STATUS.RUNNING || row.status === INSTANCE_STATUS.REJECTED
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
    await crud.refresh()
  } catch {
    // 用户取消或请求失败，交互层已提示
  }
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
</style>
