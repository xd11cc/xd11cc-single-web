<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form :inline="true" :model="searchData">
        <el-form-item :label="$t('bpm.expressionConfig.fields.name')"
          ><el-input v-model="searchData.configName" clearable
        /></el-form-item>
        <el-form-item :label="$t('bpm.expressionConfig.fields.key')"
          ><el-input v-model="searchData.configKey" clearable
        /></el-form-item>
        <el-form-item :label="$t('bpm.expressionConfig.fields.type')"
          ><el-select
            v-model="searchData.expressionType"
            clearable
            class="search-select"
            :placeholder="$t('bpm.expressionConfig.fields.type')"
            ><el-option
              v-for="item in getDictList('workflow_expression_type')"
              :key="item.id"
              :label="item.value"
              :value="item.label!" /></el-select
        ></el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" @click="getTableData">
            <template #icon><Icon icon="lucide:search" /></template>
            {{ $t('bpm.expressionConfig.actions.query') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" @click="openDialog()"
            ><Icon icon="lucide:plus-circle" /> {{ $t('common.add') }}</el-button
          >
          <el-button type="danger" @click="batchRemove"
            ><Icon icon="lucide:trash-2" /> {{ $t('common.batchDelete') }}</el-button
          >
        </div>
      </div>
      <el-table ref="tableRef" :data="tableData">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column
          prop="configName"
          :label="$t('bpm.expressionConfig.fields.name')"
          min-width="150"
        />
        <el-table-column
          prop="configKey"
          :label="$t('bpm.expressionConfig.fields.key')"
          min-width="180"
        />
        <el-table-column
          prop="expressionType"
          :label="$t('bpm.expressionConfig.fields.type')"
          width="180"
          ><template #default="{ row }">
            {{
              getDictItem('workflow_expression_type', row.expressionType || '')?.value ||
              row.expressionType
            }}
          </template></el-table-column
        >
        <el-table-column
          prop="returnType"
          :label="$t('bpm.expressionConfig.fields.returnType')"
          width="120"
          ><template #default="{ row }">
            {{
              getDictItem('workflow_expression_return_type', row.returnType || '')?.value ||
              row.returnType
            }}
          </template></el-table-column
        >
        <el-table-column
          prop="expressionTemplate"
          :label="$t('bpm.expressionConfig.fields.preview')"
          min-width="240"
          show-overflow-tooltip
        />
        <el-table-column prop="status" :label="$t('bpm.expressionConfig.fields.status')" width="90"
          ><template #default="{ row }"
            ><el-tag :type="row.status === '0' ? 'success' : 'info'">{{
              row.status === '0'
                ? $t('bpm.expressionConfig.status.enabled')
                : $t('bpm.expressionConfig.status.disabled')
            }}</el-tag></template
          ></el-table-column
        >
        <el-table-column fixed="right" :label="$t('common.action')" width="120" align="center"
          ><template #default="{ row }"
            ><el-button link type="primary" @click="openDialog(row)">{{
              $t('bpm.expressionConfig.actions.edit')
            }}</el-button
            ><el-button link type="danger" @click="removeOne(row)">{{
              $t('bpm.expressionConfig.actions.delete')
            }}</el-button></template
          ></el-table-column
        >
      </el-table>
      <div class="page-wrapper">
        <el-pagination
          background
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :current-page="paginationData.currentPage"
          :page-sizes="paginationData.pageSizes"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    <el-dialog
      v-model="dialogVisible"
      :title="
        formData.id ? $t('bpm.expressionConfig.dialog.edit') : $t('bpm.expressionConfig.dialog.add')
      "
      width="760px"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
        <el-form-item :label="$t('bpm.expressionConfig.fields.name')" prop="configName"
          ><el-input v-model="formData.configName"
        /></el-form-item>
        <el-form-item :label="$t('bpm.expressionConfig.fields.key')" prop="configKey"
          ><el-input
            v-model="formData.configKey"
            :placeholder="$t('bpm.expressionConfig.messages.keyHint')"
        /></el-form-item>
        <el-form-item :label="$t('bpm.expressionConfig.fields.type')" prop="expressionType"
          ><el-select v-model="formData.expressionType" class="full-width"
            ><el-option
              v-for="item in getDictList('workflow_expression_type')"
              :key="item.id"
              :label="item.value"
              :value="item.label!" /></el-select
        ></el-form-item>
        <el-form-item :label="$t('bpm.expressionConfig.fields.returnType')" prop="returnType"
          ><el-select v-model="formData.returnType" class="full-width"
            ><el-option
              v-for="item in getDictList('workflow_expression_return_type')"
              :key="item.id"
              :label="item.value"
              :value="item.label!" /></el-select
        ></el-form-item>
        <el-form-item :label="$t('bpm.expressionConfig.fields.template')" prop="expressionTemplate"
          ><el-input
            v-model="formData.expressionTemplate"
            type="textarea"
            :rows="4"
            :placeholder="templatePlaceholder"
          />
          <div class="template-hint">
            {{ templateHint }}
          </div>
        </el-form-item>
        <el-form-item :label="$t('bpm.expressionConfig.fields.parameters')" prop="parameterSchema">
          <div class="parameter-editor">
            <div v-for="(parameter, index) in parameters" :key="index" class="parameter-row">
              <el-input
                v-model="parameter.key"
                :placeholder="$t('bpm.expressionConfig.parameter.key')"
              />
              <el-input
                v-model="parameter.name"
                :placeholder="$t('bpm.expressionConfig.parameter.name')"
              />
              <el-select
                v-model="parameter.type"
                :placeholder="$t('bpm.expressionConfig.parameter.type')"
              >
                <el-option v-for="type in parameterTypes" :key="type" :label="type" :value="type" />
              </el-select>
              <el-checkbox v-model="parameter.required">{{
                $t('bpm.expressionConfig.parameter.required')
              }}</el-checkbox>
              <el-button link type="danger" @click="parameters.splice(index, 1)">{{
                $t('bpm.expressionConfig.actions.delete')
              }}</el-button>
            </div>
            <el-button type="primary" plain @click="addParameter"
              ><Icon icon="lucide:plus" />
              {{ $t('bpm.expressionConfig.actions.addParameter') }}</el-button
            >
          </div>
        </el-form-item>
        <el-form-item :label="$t('bpm.expressionConfig.fields.status')"
          ><el-switch v-model="enabled"
        /></el-form-item>
        <el-form-item :label="$t('bpm.expressionConfig.fields.remark')"
          ><el-input v-model="formData.remark" type="textarea"
        /></el-form-item>
      </el-form>
      <template #footer
        ><el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button
        ><el-button type="primary" :loading="saving" @click="submit">{{
          $t('common.save')
        }}</el-button></template
      >
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { usePagination } from '@@/composables/usePagination'
import { cloneDeep } from 'lodash-es'
import type { FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useDict } from '@/common/composables/useDict'
import {
  expressionConfigPage,
  addExpressionConfig,
  modifyExpressionConfig,
  removeExpressionConfig,
} from './apis'
import type {
  ExpressionParameterDefinition,
  WorkflowExpressionConfigQueryVO,
  WorkflowExpressionConfigVO,
} from './apis/type'

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const { t, locale } = useI18n()
const $t = t
const { getDictList, getDictItem } = useDict([
  'workflow_expression_type',
  'workflow_expression_return_type',
])
const searchData = reactive<WorkflowExpressionConfigQueryVO>({})
const tableData = ref<WorkflowExpressionConfigVO[]>([])
const tableRef = useTemplateRef<any>('tableRef')
const formRef = useTemplateRef<any>('formRef')
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formData = ref<WorkflowExpressionConfigVO>({ status: '0', parameterSchema: '[]' })
const parameters = ref<ExpressionParameterDefinition[]>([])
const parameterTypes: ExpressionParameterDefinition['type'][] = [
  'STRING',
  'NUMBER',
  'BOOLEAN',
  'PROCESS_VARIABLE',
]
const templateExamples: Record<string, string> = {
  ASSIGNEE: '${approvalService.resolveUser({{businessId}})}',
  MULTI_INSTANCE_USERS: '${approvalService.resolveUsers({{businessId}})}',
  SEQUENCE_CONDITION: '${amount > {{threshold}}}',
  LISTENER_EXPRESSION: '${workflowListener.handle(execution, {{businessId}})}',
  default: '${service.method({{parameter}})}',
}
const templatePlaceholder = computed(() =>
  locale.value === 'en'
    ? 'For example: ${approvalService.resolve({{businessId}})}'
    : '例如：${approvalService.resolve({{businessId}})}',
)
const templateHint = computed(() => {
  const type = formData.value.expressionType || 'default'
  const example = templateExamples[type] || templateExamples.default
  return $t('bpm.expressionConfig.messages.templateHint', { example })
})
const enabled = computed({
  get: () => formData.value.status === '0',
  set: (v) => {
    formData.value.status = v ? '0' : '1'
  },
})
const required = (field: string) =>
  $t('bpm.expressionConfig.messages.required', { name: $t(field) })
const rules: FormRules = {
  configName: [{ required: true, message: required('bpm.expressionConfig.fields.name') }],
  configKey: [{ required: true, message: required('bpm.expressionConfig.fields.key') }],
  expressionType: [{ required: true, message: required('bpm.expressionConfig.fields.type') }],
  returnType: [{ required: true, message: required('bpm.expressionConfig.fields.returnType') }],
  expressionTemplate: [
    { required: true, message: required('bpm.expressionConfig.fields.template') },
  ],
  parameterSchema: [
    { required: true, message: required('bpm.expressionConfig.fields.parameters') },
  ],
}
function getTableData() {
  loading.value = true
  expressionConfigPage({
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  })
    .then(({ data }) => {
      paginationData.total = data.total
      tableData.value = data.rows
    })
    .finally(() => {
      loading.value = false
    })
}
function openDialog(row?: WorkflowExpressionConfigVO) {
  formData.value = row ? cloneDeep(row) : { status: '0', parameterSchema: '[]' }
  try {
    parameters.value = JSON.parse(formData.value.parameterSchema || '[]')
  } catch {
    parameters.value = []
  }
  dialogVisible.value = true
}
function addParameter() {
  parameters.value.push({ key: '', name: '', type: 'STRING', required: true })
}
function submit() {
  formRef.value?.validate((ok: boolean) => {
    if (!ok) return
    if (parameters.value.some((p) => !p.key || !p.name))
      return ElMessage.warning($t('bpm.expressionConfig.messages.completeParameters'))
    formData.value.parameterSchema = JSON.stringify(parameters.value)
    saving.value = true
    const api = formData.value.id ? modifyExpressionConfig : addExpressionConfig
    api(formData.value)
      .then(() => {
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        saving.value = false
      })
  })
}
async function removeOne(row: WorkflowExpressionConfigVO) {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(
      $t('bpm.expressionConfig.messages.deleteConfirm'),
      $t('common.messages.confirmTitle'),
    )
    await removeExpressionConfig(String(row.id))
    getTableData()
  } catch {
    // 取消确认或请求失败时，统一由交互层/请求层处理。
  }
}
async function batchRemove() {
  const rows = tableRef.value?.getSelectionRows?.() || []
  if (!rows.length) return ElMessage.warning($t('bpm.expressionConfig.messages.selectFirst'))
  try {
    await ElMessageBox.confirm(
      $t('bpm.expressionConfig.messages.batchDeleteConfirm', { count: rows.length }),
      $t('common.messages.confirmTitle'),
    )
    await removeExpressionConfig(rows.map((row: WorkflowExpressionConfigVO) => row.id).join(','))
    getTableData()
  } catch {
    // 取消确认或请求失败时，统一由交互层/请求层处理。
  }
}
watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, {
  immediate: true,
})
</script>

<style scoped lang="scss">
.search-actions {
  margin-bottom: 18px;
}
.search-select {
  width: 180px;
}
.template-hint {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: var(--p-text-sm);
  line-height: 1.5;
}
// .toolbar-wrapper 走全局骨架（flex + 间距）
.page-wrapper {
  margin-top: var(--p-space-5);
}
.parameter-editor {
  width: 100%;
}
.parameter-row {
  display: grid;
  grid-template-columns: 1fr 1fr 150px 70px 48px;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
</style>
