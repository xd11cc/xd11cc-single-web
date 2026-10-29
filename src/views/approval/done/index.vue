<template>
  <UseCrudView :slotProps="crud.slotProps" readonly>
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item :label="$t('bpm.approval.done.search.title')">
        <el-input
          v-model="searchData.title"
          clearable
          :placeholder="$t('bpm.approval.done.placeholder.title')"
          class="search-field-xl"
        />
      </el-form-item>
      <el-form-item :label="$t('bpm.approval.done.search.processKey')">
        <el-input
          v-model="searchData.processDefinitionKey"
          clearable
          :placeholder="$t('bpm.approval.done.placeholder.processKey')"
          class="search-field-lg"
        />
      </el-form-item>
    </template>

    <!-- 表格列 -->
    <template #table>
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
    </template>

    <!-- 空状态 -->
    <template #empty>
      <el-empty :description="$t('common.messages.noData')" />
    </template>

    <!-- 页面自有弹窗 / 抽屉：放进 #extra，保证壳只有一个根节点 -->
    <template #extra>
      <!-- 流程详情抽屉：不属于新增/编辑，放在壳的同一级 -->
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
import { getMyDoneTasks } from '../apis'
import type { MyTaskQuery, WorkflowTaskVO } from '../apis/type'
import ApprovalDetailDrawer from '../components/ApprovalDetailDrawer.vue'

defineOptions({ name: 'ApprovalDone' })

const { t } = useI18n()
const $t = t

// 已办任务：只读列表，操作只有「查看详情」
const crud = useCrud<MyTaskQuery, WorkflowTaskVO>({
  pageApi: (query) => getMyDoneTasks(query),
})

const detailVisible = ref(false)
const activeProcessInstanceId = ref('')

function openDetail(row: WorkflowTaskVO) {
  if (!row.processInstanceId) return
  activeProcessInstanceId.value = row.processInstanceId
  detailVisible.value = true
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
