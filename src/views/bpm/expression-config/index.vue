<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :formRules="rules"
    :add-title="$t('bpm.expressionConfig.dialog.add')"
    :edit-title="$t('bpm.expressionConfig.dialog.edit')"
    dialog-width="760px"
    label-width="120px"
  >
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item :label="$t('bpm.expressionConfig.fields.name')">
        <el-input v-model="searchData.configName" clearable />
      </el-form-item>
      <el-form-item :label="$t('bpm.expressionConfig.fields.key')">
        <el-input v-model="searchData.configKey" clearable />
      </el-form-item>
      <el-form-item :label="$t('bpm.expressionConfig.fields.type')">
        <el-select
          v-model="searchData.expressionType"
          clearable
          class="search-field-md"
          :placeholder="$t('bpm.expressionConfig.fields.type')"
        >
          <el-option
            v-for="item in getDictList('workflow_expression_type')"
            :key="item.id"
            :label="item.label"
            :value="item.value!"
          />
        </el-select>
      </el-form-item>
    </template>

    <!-- 工具栏 -->
    <template #actions="{ handleAdd, handleBatchRemove }">
      <el-button
        type="primary"
        @click="handleAdd"
        v-permission="['workflow:expression-config:add']"
      >
        <template #icon><Icon icon="lucide:plus-circle" /></template>
        {{ $t('common.add') }}
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchRemove"
        v-permission="['workflow:expression-config:delete']"
      >
        <template #icon><Icon icon="lucide:trash-2" /></template>
        {{ $t('common.batchDelete') }}
      </el-button>
    </template>

    <!-- 表格列 -->
    <template #table="{ handleEdit, handleRemove }">
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
      >
        <template #default="{ row }">
          {{
            getDictItem('workflow_expression_type', row.expressionType || '')?.label ||
            row.expressionType
          }}
        </template>
      </el-table-column>
      <el-table-column
        prop="returnType"
        :label="$t('bpm.expressionConfig.fields.returnType')"
        width="120"
      >
        <template #default="{ row }">
          {{
            getDictItem('workflow_expression_return_type', row.returnType || '')?.label ||
            row.returnType
          }}
        </template>
      </el-table-column>
      <el-table-column
        prop="expressionTemplate"
        :label="$t('bpm.expressionConfig.fields.preview')"
        min-width="240"
        show-overflow-tooltip
      />
      <el-table-column
        prop="status"
        :label="$t('bpm.expressionConfig.fields.status')"
        align="center"
        width="90"
      >
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'info'" effect="plain" size="small">
            {{
              row.status === '0'
                ? $t('bpm.expressionConfig.status.enabled')
                : $t('bpm.expressionConfig.status.disabled')
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" :label="$t('common.action')" width="90" align="center">
        <template #default="{ row }">
          <el-tooltip :content="$t('common.edit')" placement="top">
            <el-button
              type="warning"
              text
              bg
              size="small"
              @click="handleEdit(row)"
              v-permission="['workflow:expression-config:update']"
            >
              <Icon icon="lucide:pencil" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('common.delete')" placement="top">
            <el-button
              type="danger"
              text
              bg
              size="small"
              @click="handleRemove(row)"
              v-permission="['workflow:expression-config:delete']"
            >
              <Icon icon="lucide:trash-2" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </template>

    <!-- 新增/编辑表单 -->
    <template #form-fields="{ formData }">
      <el-col :span="12">
        <el-form-item :label="$t('bpm.expressionConfig.fields.name')" prop="configName">
          <el-input v-model="formData.configName" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('bpm.expressionConfig.fields.key')" prop="configKey">
          <el-input
            v-model="formData.configKey"
            :placeholder="$t('bpm.expressionConfig.messages.keyHint')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('bpm.expressionConfig.fields.type')" prop="expressionType">
          <el-select v-model="formData.expressionType" class="full-width">
            <el-option
              v-for="item in getDictList('workflow_expression_type')"
              :key="item.id"
              :label="item.label"
              :value="item.value!"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('bpm.expressionConfig.fields.returnType')" prop="returnType">
          <el-select v-model="formData.returnType" class="full-width">
            <el-option
              v-for="item in getDictList('workflow_expression_return_type')"
              :key="item.id"
              :label="item.label"
              :value="item.value!"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item :label="$t('bpm.expressionConfig.fields.template')" prop="expressionTemplate">
          <el-input
            v-model="formData.expressionTemplate"
            type="textarea"
            :rows="4"
            :placeholder="templatePlaceholder"
          />
          <div class="template-hint">{{ templateHint }}</div>
        </el-form-item>
      </el-col>
      <el-col :span="24">
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
              <el-checkbox v-model="parameter.required">
                {{ $t('bpm.expressionConfig.parameter.required') }}
              </el-checkbox>
              <el-button link type="danger" @click="parameters.splice(index, 1)">
                {{ $t('bpm.expressionConfig.actions.delete') }}
              </el-button>
            </div>
            <el-button type="primary" plain @click="addParameter">
              <template #icon><Icon icon="lucide:plus" /></template>
              {{ $t('bpm.expressionConfig.actions.addParameter') }}
            </el-button>
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('bpm.expressionConfig.fields.status')">
          <el-switch v-model="formData.status" active-value="0" inactive-value="1" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item :label="$t('bpm.expressionConfig.fields.remark')">
          <el-input v-model="formData.remark" type="textarea" />
        </el-form-item>
      </el-col>
    </template>
  </UseCrudView>
</template>

<script setup lang="ts">
defineOptions({ name: 'ExpressionConfig' })
import { Icon } from '@iconify/vue'
import type { FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
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

const { t, locale } = useI18n()
const $t = t

const { getDictList, getDictItem } = useDict([
  'workflow_expression_type',
  'workflow_expression_return_type',
])

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

// 模板示例随所选表达式类型变化，需要读取当前表单内容
const templateHint = computed(() => {
  const type = crud.state.formData.value?.expressionType || 'default'
  const example = templateExamples[type] || templateExamples.default
  return $t('bpm.expressionConfig.messages.templateHint', { example })
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
  // 参数表格不全时阻止提交，替代原先 submit 里的手工校验
  parameterSchema: [
    {
      validator: (_rule, _value, callback) => {
        const incomplete = parameters.value.some((item) => !item.key || !item.name)
        callback(
          incomplete
            ? new Error($t('bpm.expressionConfig.messages.completeParameters'))
            : undefined,
        )
      },
      trigger: 'blur',
    },
  ],
}

const crud = useCrud<WorkflowExpressionConfigQueryVO, WorkflowExpressionConfigVO>({
  pageApi: (query) => expressionConfigPage(query),
  addApi: (data) => addExpressionConfig(data),
  updateApi: (data) => modifyExpressionConfig(data),
  removeApi: (ids) => removeExpressionConfig(ids),
  defaultForm: () => ({ status: '0', parameterSchema: '[]' }),
  transformPayload: (form) => ({
    ...form,
    parameterSchema: JSON.stringify(parameters.value),
  }),
  removeConfirmText: () => $t('bpm.expressionConfig.messages.deleteConfirm'),
  batchRemoveConfirmText: (count) =>
    $t('bpm.expressionConfig.messages.batchDeleteConfirm', { count }),
  // 弹窗打开时把 JSON 串反序列化成参数行
  onDialogOpen: ({ form }) => {
    try {
      parameters.value = JSON.parse(form.parameterSchema || '[]')
    } catch {
      parameters.value = []
    }
  },
})

function addParameter() {
  parameters.value.push({ key: '', name: '', type: 'STRING', required: true })
}
</script>

<style scoped lang="scss">
.full-width {
  width: 100%;
}

.template-hint {
  margin-top: var(--p-space-1-5);
  color: var(--el-text-color-secondary);
  font-size: var(--p-text-sm);
  line-height: 1.5;
}

.parameter-editor {
  width: 100%;
}

.parameter-row {
  display: grid;
  grid-template-columns: 1fr 1fr 150px 70px 48px;
  gap: var(--p-space-2);
  align-items: center;
  margin-bottom: var(--p-space-2-5);
}
</style>
