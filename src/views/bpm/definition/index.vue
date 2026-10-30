<template>
  <div class="definition-page">
    <UseCrudView
      :slotProps="crud.slotProps"
      :formRules="formRules"
      :add-title="$t('bpm.definition.dialogs.add')"
      :edit-title="$t('bpm.definition.dialogs.edit')"
    >
      <!-- 搜索区字段 -->
      <template #search-form="{ searchData }">
        <el-form-item prop="name" :label="$t('bpm.definition.search.name')">
          <el-input
            v-model="searchData.name"
            :placeholder="$t('bpm.definition.placeholder.name')"
          />
        </el-form-item>
        <el-form-item prop="key" :label="$t('bpm.definition.search.key')">
          <el-input v-model="searchData.key" :placeholder="$t('bpm.definition.placeholder.key')" />
        </el-form-item>
        <el-form-item prop="category" :label="$t('bpm.definition.search.category')">
          <el-input
            v-model="searchData.category"
            :placeholder="$t('bpm.definition.placeholder.category')"
          />
        </el-form-item>
      </template>

      <!-- 工具栏 -->
      <template #actions="{ rowSelection }">
        <el-button type="primary" @click="goToDesign">
          <template #icon><Icon icon="lucide:plus-circle" /></template>
          {{ $t('common.add') }}
        </el-button>
        <el-button type="danger" @click="handleBatchRemove">
          <template #icon><Icon icon="lucide:trash-2" /></template>
          {{ $t('common.batchDelete') }} ({{ rowSelection.length }})
        </el-button>
      </template>

      <!-- 表格列 -->
      <template #table>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column
          prop="key"
          :label="$t('bpm.definition.columns.key')"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          prop="name"
          :label="$t('bpm.definition.columns.name')"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          prop="version"
          :label="$t('bpm.definition.columns.version')"
          align="center"
          width="100"
        >
          <template #default="scope">
            <span v-if="scope.row.version" class="version-badge">
              <Icon icon="lucide:git-branch" />
              <strong>v{{ scope.row.version }}</strong>
            </span>
            <span v-else class="version-draft-badge">
              <Icon icon="lucide:pen-line" />
              {{ getStatusItem(scope.row)?.value || scope.row.status || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="category"
          :label="$t('bpm.definition.columns.category')"
          width="110"
          show-overflow-tooltip
        />
        <el-table-column
          prop="deployTime"
          :label="$t('bpm.definition.columns.deployTime')"
          align="center"
          min-width="170"
        />
        <el-table-column
          prop="status"
          :label="$t('bpm.definition.columns.suspended')"
          align="center"
          width="90"
        >
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row)"
              effect="plain"
              size="small"
              disable-transitions
            >
              {{ getStatusItem(scope.row)?.value || scope.row.status || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" :label="$t('common.action')" width="150" align="center">
          <template #default="scope">
            <div class="action-icons">
              <el-tooltip
                :content="$t('bpm.definition.actions.versions')"
                placement="top"
                :show-after="200"
              >
                <el-button circle size="small" @click="openVersionDialog(scope.row)">
                  <Icon icon="lucide:layers-3" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-if="scope.row.status === 'DRAFT'"
                :content="$t('bpm.definition.actions.edit')"
                placement="top"
                :show-after="200"
              >
                <el-button circle size="small" type="primary" plain @click="editDraft(scope.row)">
                  <Icon icon="lucide:pen-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-if="scope.row.status === 'DRAFT'"
                :content="$t('bpm.definition.actions.delete')"
                placement="top"
                :show-after="200"
              >
                <el-button circle size="small" type="danger" plain @click="deleteDraft(scope.row)">
                  <Icon icon="lucide:trash-2" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-if="scope.row.status === 'ACTIVE'"
                :content="$t('bpm.definition.actions.suspend')"
                placement="top"
                :show-after="200"
              >
                <el-button
                  circle
                  size="small"
                  type="warning"
                  plain
                  @click="changeDefinitionStatus(scope.row, 'suspend')"
                >
                  <Icon icon="lucide:pause" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-if="scope.row.status === 'SUSPENDED'"
                :content="$t('bpm.definition.actions.activate')"
                placement="top"
                :show-after="200"
              >
                <el-button
                  circle
                  size="small"
                  type="success"
                  plain
                  @click="changeDefinitionStatus(scope.row, 'activate')"
                >
                  <Icon icon="lucide:play" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-if="scope.row.status === 'CONFLICT'"
                :content="$t('bpm.definition.actions.viewIssue')"
                placement="top"
                :show-after="200"
              >
                <el-button circle size="small" type="danger" plain @click="showConflictMessage">
                  <Icon icon="lucide:triangle-alert" />
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </template>
    </UseCrudView>
    <el-dialog
      v-model="versionDialogVisible"
      width="min(900px, calc(100vw - 32px))"
      class="version-dialog"
      destroy-on-close
    >
      <template #header>
        <div class="version-dialog-header">
          <div>
            <div class="eyebrow">{{ $t('bpm.definition.versionDialog.eyebrow') }}</div>
            <h2>{{ versionDialogName || versionDialogKey }}</h2>
            <span class="version-dialog-key">{{ versionDialogKey }}</span>
          </div>
          <div class="version-count">
            <strong>{{ versionRows.length }}</strong>
            <span>{{ $t('bpm.definition.versionDialog.total') }}</span>
          </div>
        </div>
      </template>
      <div v-table-loading="versionLoading" class="version-list">
        <div v-if="!versionLoading && !versionRows.length" class="version-empty">
          <Icon icon="lucide:layers-3" />
          <span>{{ $t('bpm.definition.versionDialog.empty') }}</span>
        </div>
        <div
          v-for="(version, index) in versionRows"
          :key="version.processDefinitionId"
          class="version-item"
        >
          <div class="version-rail">
            <span class="version-dot" :class="`is-${version.status?.toLowerCase()}`"></span>
            <span v-if="index < versionRows.length - 1" class="version-line"></span>
          </div>
          <div class="version-card">
            <div class="version-card-main">
              <div class="version-title">
                <span class="version-number">v{{ version.version }}</span>
                <span>{{ version.name || '-' }}</span>
                <el-tag :type="getVersionStatusType(version)" effect="plain" size="small">
                  {{ getVersionStatusItem(version)?.value || version.status }}
                </el-tag>
              </div>
              <div class="version-meta">
                <span><Icon icon="lucide:calendar-clock" />{{ version.deployTime || '-' }}</span>
                <span><Icon icon="lucide:package" />{{ version.deploymentId || '-' }}</span>
              </div>
            </div>
            <el-button
              v-if="
                version.status === 'ACTIVE' ||
                version.status === 'CONFLICT' ||
                version.status === 'SUSPENDED'
              "
              link
              type="primary"
              @click="operateVersion(version)"
            >
              {{
                version.status === 'SUSPENDED'
                  ? $t('bpm.definition.actions.activate')
                  : $t('bpm.definition.actions.suspend')
              }}
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import type { FormRules } from 'element-plus'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { useDict } from '@/common/composables/useDict'
import {
  activateWorkflowDefinition,
  getDefinitionPage,
  getWorkflowDefinitionVersions,
  removeWorkflowDraft,
  suspendWorkflowDefinition,
} from './apis'
import type {
  WorkflowDefinitionQueryVO,
  WorkflowDefinitionVersionVO,
  WorkflowDefinitionVO,
} from './apis/type'

const { t } = useI18n()
const $t = t
const route = useRoute()
const router = useRouter()
const { getDictItem } = useDict('workflow_definition_status')
const versionDialogVisible = ref(false)
const versionLoading = ref(false)
const versionRows = ref<WorkflowDefinitionVersionVO[]>([])
const versionDialogKey = ref('')
const versionDialogName = ref('')

defineOptions({ name: 'Definition' })

const crud = useCrud<WorkflowDefinitionQueryVO, WorkflowDefinitionVO>({
  pageApi: (query) => getDefinitionPage(query),
})

function goToDesign() {
  router.push({
    path: '/workflow/modeler',
    query: { returnTo: route.fullPath },
  })
}

function editDraft(row: WorkflowDefinitionVO) {
  if (!row.id) return
  router.push({
    path: '/workflow/modeler',
    query: { modelId: row.id, returnTo: route.fullPath },
  })
}

async function deleteDraft(row: WorkflowDefinitionVO) {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(
      $t('common.messages.deleteConfirm'),
      $t('common.messages.confirmTitle'),
      { type: 'warning' },
    )
    await removeWorkflowDraft(row.id)
    ElMessage.success($t('common.messages.deleteSuccess'))
    crud.refresh()
  } catch {
    // 取消确认或请求失败时由交互层处理。
  }
}

async function changeDefinitionStatus(row: WorkflowDefinitionVO, action: 'suspend' | 'activate') {
  if (!row.processDefinitionId) {
    ElMessage.warning($t('bpm.definition.messages.statusUnavailable'))
    return
  }
  try {
    await ElMessageBox.confirm(
      $t(`bpm.definition.messages.${action}Confirm`),
      $t('common.messages.confirmTitle'),
      { type: 'warning' },
    )
    if (action === 'suspend') await suspendWorkflowDefinition(row.processDefinitionId)
    else await activateWorkflowDefinition(row.processDefinitionId)
    ElMessage.success($t('common.messages.operationSuccess'))
    crud.refresh()
  } catch {
    // 取消确认或请求失败时由交互层处理。
  }
}

function showConflictMessage() {
  ElMessage.warning($t('bpm.definition.messages.conflictHint'))
}

async function openVersionDialog(row: WorkflowDefinitionVO) {
  if (!row.key) return
  versionDialogKey.value = row.key
  versionDialogName.value = row.name || ''
  versionRows.value = []
  versionDialogVisible.value = true
  versionLoading.value = true
  try {
    const { data } = await getWorkflowDefinitionVersions(row.key)
    versionRows.value = data || []
  } finally {
    versionLoading.value = false
  }
}

function getVersionStatusItem(row: WorkflowDefinitionVersionVO) {
  return getDictItem('workflow_definition_status', row.status || 'CONFLICT')
}

function getVersionStatusType(row: WorkflowDefinitionVersionVO) {
  return getVersionStatusItem(row)?.listClass || 'info'
}

async function operateVersion(row: WorkflowDefinitionVersionVO) {
  if (!row.processDefinitionId) return
  await changeDefinitionStatus(
    { processDefinitionId: row.processDefinitionId },
    row.status === 'SUSPENDED' ? 'activate' : 'suspend',
  )
  if (versionDialogKey.value) {
    const { data } = await getWorkflowDefinitionVersions(versionDialogKey.value)
    versionRows.value = data || []
  }
}

async function handleBatchRemove() {
  const selectedRows = crud.slotProps.rowSelection
  if (selectedRows.length === 0) {
    ElMessage.warning($t('common.messages.selectFirst'))
    return
  }

  if (selectedRows.some((row) => Boolean(row.deploymentId))) {
    ElMessage.warning($t('bpm.definition.messages.onlyDraftDelete'))
    return
  }
  const modelIds = selectedRows.map((row) => row.id).filter((id): id is string => Boolean(id))

  if (modelIds.length !== selectedRows.length) {
    ElMessage.warning($t('common.messages.noData'))
    return
  }

  try {
    await ElMessageBox.confirm(
      $t('common.messages.deleteSelected', { count: selectedRows.length }),
      $t('common.messages.confirmTitle'),
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'warning',
      },
    )
  } catch {
    return
  }

  try {
    await Promise.all(modelIds.map((modelId) => removeWorkflowDraft(modelId)))
    ElMessage.success($t('common.messages.deleteSuccess'))
  } catch {
    // 请求层已统一处理错误提示
  } finally {
    crud.refresh()
  }
}

const formRules: FormRules = {}

function getStatusItem(row: WorkflowDefinitionVO) {
  return getDictItem('workflow_definition_status', row.status || 'CONFLICT')
}

function getStatusType(row: WorkflowDefinitionVO) {
  return getStatusItem(row)?.listClass || 'info'
}
</script>

<style lang="scss" scoped>
.action-icons {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: var(--p-space-1-5);
  align-items: center;
  justify-content: center;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

:deep(.version-dialog .el-dialog__header) {
  margin-right: 0;
  padding: var(--p-space-6) var(--p-space-7) var(--p-space-4-5);
  border-bottom: 1px solid var(--theme-border);
}
:deep(.version-dialog .el-dialog__body) {
  padding: var(--p-space-2) var(--p-space-7) var(--p-space-7);
}
.version-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--p-space-5);
}
.eyebrow {
  color: var(--theme-accent-strong);
  font-size: var(--p-text-xs);
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.version-dialog-header h2 {
  margin: 6px 0 3px;
  color: var(--theme-text-primary);
  font-size: var(--p-text-2xl);
  line-height: 1.25;
}
.version-dialog-key {
  color: var(--theme-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--p-text-sm);
}
.version-count {
  display: grid;
  min-width: 76px;
  padding: 9px 12px;
  color: var(--theme-text-secondary);
  text-align: center;
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-xl);
  background: var(--theme-accent-light);
}
.version-count strong {
  color: var(--theme-accent-strong);
  font-size: var(--p-text-2xl);
  line-height: 1;
}
.version-count span {
  margin-top: 5px;
  font-size: var(--p-text-xs);
}
.version-list {
  min-height: 120px;
  padding-top: var(--p-space-3);
}
.version-item {
  display: flex;
  gap: var(--p-space-3-5);
}
.version-rail {
  position: relative;
  display: flex;
  width: 18px;
  flex: none;
  justify-content: center;
}
.version-dot {
  z-index: 1;
  width: 11px;
  height: 11px;
  margin-top: var(--p-space-4-5);
  border: 3px solid var(--theme-bg-surface);
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--theme-border);
  background: var(--theme-text-muted);
}
.version-dot.is-active {
  background: var(--theme-accent);
  box-shadow: 0 0 0 2px var(--theme-accent);
}
.version-dot.is-suspended {
  background: var(--theme-warning);
  box-shadow: 0 0 0 2px var(--theme-warning-light);
}
.version-dot.is-conflict {
  background: var(--theme-danger);
  box-shadow: 0 0 0 2px var(--theme-danger-light);
}
.version-line {
  position: absolute;
  top: 30px;
  bottom: -18px;
  width: 1px;
  background: var(--theme-bg-sunken);
}
.version-card {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: var(--p-space-4);
  margin-bottom: var(--p-space-3);
  padding: 15px 16px;
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-xl);
  background: var(--theme-bg-surface);
  box-shadow: 0 4px 16px rgb(37 71 60 / 4%);
  transition:
    border-color var(--p-duration-normal) ease,
    box-shadow var(--p-duration-normal) ease;
}
.version-card:hover {
  border-color: var(--theme-accent);
  box-shadow: 0 8px 22px rgb(37 71 60 / 8%);
}
.version-title,
.version-meta {
  display: flex;
  align-items: center;
  gap: 9px;
}
.version-title {
  color: var(--theme-text-primary);
  font-size: var(--p-text-md);
  font-weight: 650;
}
.version-number {
  color: var(--theme-accent-strong);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--p-text-base);
  font-weight: 700;
}
.version-meta {
  margin-top: var(--p-space-2);
  color: var(--theme-text-muted);
  font-size: var(--p-text-xs);
}
.version-meta span {
  display: inline-flex;
  align-items: center;
  gap: var(--p-space-1);
}
.version-empty {
  display: grid;
  justify-items: center;
  gap: var(--p-space-2-5);
  padding: var(--p-space-10) 0;
  color: var(--theme-text-muted);
}
.version-empty :deep(svg) {
  width: 30px;
  height: 30px;
}
.version-badge,
.version-draft-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 54px;
  height: 28px;
  padding: 0 9px;
  border-radius: var(--p-radius-lg);
  font-size: var(--p-text-sm);
  line-height: 1;
}
.version-badge {
  color: var(--theme-accent-strong);
  border: 1px solid var(--theme-border);
  background: linear-gradient(135deg, var(--theme-accent-light), var(--theme-accent-light));
  box-shadow: inset 0 1px rgb(255 255 255 / 80%);
}
.version-badge :deep(svg) {
  width: 13px;
  height: 13px;
  opacity: 0.8;
}
.version-badge strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--p-text-base);
  letter-spacing: 0.02em;
}
.version-draft-badge {
  color: var(--theme-text-muted);
  border: 1px dashed var(--theme-border);
  background: var(--theme-bg-page);
  font-size: var(--p-text-xs);
}
.version-draft-badge :deep(svg) {
  width: 13px;
  height: 13px;
}
</style>
