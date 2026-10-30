<template>
  <el-dialog
    v-model="visible"
    :title="t(editingId ? 'bpm.modeler.listener.dialogEdit' : 'bpm.modeler.listener.dialogAdd')"
    width="560px"
    append-to-body
    destroy-on-close
  >
    <el-form ref="formRef" :model="draft" :rules="listenerRules" label-position="top">
      <div class="listener-form-grid">
        <el-form-item :label="t('bpm.modeler.listener.type')" prop="listenerType">
          <el-radio-group v-model="draft.listenerType" @change="resetListenerEvent">
            <el-radio-button v-if="allowTaskListener" value="task">
              {{ t('bpm.modeler.listener.taskListener') }}
            </el-radio-button>
            <el-radio-button value="execution">{{
              t('bpm.modeler.listener.executionListener')
            }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('bpm.modeler.listener.event')" prop="event">
          <el-select v-model="draft.event" class="full-width">
            <el-option
              v-for="option in currentEventOptions"
              :key="option.value"
              :label="t(option.key)"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item :label="t('bpm.modeler.listener.implementationType')" prop="implementationType">
        <el-select v-model="draft.implementationType" class="full-width">
          <el-option :label="t('bpm.modeler.listener.implementationTypes.class')" value="class" />
          <el-option
            :label="t('bpm.modeler.listener.implementationTypes.expression')"
            value="expression"
          />
          <el-option
            :label="t('bpm.modeler.listener.implementationTypes.delegateExpression')"
            value="delegateExpression"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="draft.implementationType === 'class'"
        :label="t('bpm.modeler.listener.implementation')"
        prop="implementation"
      >
        <el-input v-model="draft.implementation" :placeholder="implementationPlaceholder" />
      </el-form-item>
      <template v-else>
        <el-form-item
          :label="t('bpm.modeler.property.fields.expressionConfig')"
          prop="implementation"
        >
          <el-select
            v-model="draft.expressionConfigKey"
            class="full-width"
            filterable
            @change="applyListenerConfig"
          >
            <el-option
              v-for="option in expressionCatalog.options('LISTENER_EXPRESSION')"
              :key="option.configKey"
              :label="option.configName"
              :value="option.configKey"
            />
          </el-select>
        </el-form-item>
        <template
          v-for="parameter in expressionCatalog.parameters(draft.expressionConfigKey)"
          :key="parameter.key"
        >
          <el-form-item :label="parameter.name"
            ><el-select
              v-if="parameter.type === 'PROCESS_VARIABLE'"
              v-model="draft.expressionParameters![parameter.key]"
              class="full-width"
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
              :placeholder="parameter.name"
              @change="applyListenerConfig"
              ><el-option
                v-for="option in processVariableOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value" /></el-select
            ><el-input
              v-else
              :model-value="String(draft.expressionParameters?.[parameter.key] ?? '')"
              @update:model-value="setListenerParameter(parameter.key, $event)"
              @change="applyListenerConfig"
          /></el-form-item>
        </template>
        <el-form-item :label="t('bpm.modeler.property.fields.expressionPreview')"
          ><el-input v-model="draft.implementation" readonly
        /></el-form-item>
      </template>

      <div class="field-editor-heading">
        <div>
          <strong>{{ t('bpm.modeler.listener.fieldInjection') }}</strong>
          <span>{{ t('bpm.modeler.listener.fieldInjectionHelp') }}</span>
        </div>
        <el-button size="small" text bg @click="addListenerField">
          <Icon icon="lucide:plus" />{{ t('bpm.modeler.actions.addField') }}
        </el-button>
      </div>
      <div v-if="draft.fields.length" class="field-editor-list">
        <div v-for="(field, index) in draft.fields" :key="index" class="field-editor-row">
          <el-input v-model="field.name" :placeholder="t('bpm.modeler.listener.fieldName')" />
          <el-select v-model="field.valueType" class="field-type-select">
            <el-option :label="t('bpm.modeler.listener.valueTypes.string')" value="stringValue" />
            <el-option
              :label="t('bpm.modeler.listener.valueTypes.expression')"
              value="expression"
            />
          </el-select>
          <el-select
            v-if="field.valueType === 'expression'"
            v-model="field.expressionConfigKey"
            filterable
            @change="applyFieldConfig(field)"
          >
            <el-option
              v-for="option in expressionCatalog.options('LISTENER_EXPRESSION')"
              :key="option.configKey"
              :label="option.configName"
              :value="option.configKey"
            />
          </el-select>
          <el-input
            v-else
            v-model="field.value"
            :placeholder="t('bpm.modeler.listener.fieldValue')"
          />
          <button type="button" class="field-remove" @click="draft.fields.splice(index, 1)">
            <Icon icon="lucide:x" />
          </button>
        </div>
      </div>
      <div v-else class="field-editor-empty">{{ t('bpm.modeler.listener.noFields') }}</div>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">{{
        t('bpm.modeler.actions.saveListener')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { createExpressionCatalog } from '../expression-catalog'
import { cloneListener, createEmptyListener } from '../listener-io'
import type { ListenerConfig } from '../types'
import type { WorkflowExpressionConfigVO } from '../../expression-config/apis/type'

/**
 * 监听器编辑弹窗。
 *
 * 从 PropertyPanel 里拆出来：这块是「一种元素监听器的完整编辑表单」，
 * 与属性面板的类型分派无关，拆开后主文件少 171 行模板 + 约 120 行脚本。
 *
 * 打开方式用 defineExpose 的 open()，与项目里 ApprovalDetailDrawer 保持一致。
 */

defineOptions({ name: 'ListenerDialog' })

const props = defineProps<{
  /** 是否允许任务监听器（只有用户任务可以） */
  allowTaskListener?: boolean
  /** 连线只支持 take 事件 */
  isSequenceFlow?: boolean
  expressionOptions?: WorkflowExpressionConfigVO[]
  processVariableOptions?: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{ save: [listener: ListenerConfig] }>()

const { t } = useI18n()

const visible = ref(false)
const editingId = ref('')
const formRef = useTemplateRef<any>('formRef')
const draft = reactive<ListenerConfig>(createEmptyListener())

const expressionCatalog = computed(() => createExpressionCatalog(props.expressionOptions ?? []))

const taskEventOptions = [
  { key: 'bpm.modeler.listener.events.create', value: 'create' },
  { key: 'bpm.modeler.listener.events.assignment', value: 'assignment' },
  { key: 'bpm.modeler.listener.events.complete', value: 'complete' },
  { key: 'bpm.modeler.listener.events.delete', value: 'delete' },
  { key: 'bpm.modeler.listener.events.update', value: 'update' },
  { key: 'bpm.modeler.listener.events.timeout', value: 'timeout' },
  { key: 'bpm.modeler.listener.events.all', value: 'all' },
]
const executionEventOptions = [
  { key: 'bpm.modeler.listener.events.start', value: 'start' },
  { key: 'bpm.modeler.listener.events.end', value: 'end' },
]
const sequenceFlowEventOptions = [{ key: 'bpm.modeler.listener.events.take', value: 'take' }]

const currentEventOptions = computed(() =>
  props.isSequenceFlow
    ? sequenceFlowEventOptions
    : draft.listenerType === 'task'
      ? taskEventOptions
      : executionEventOptions,
)

const implementationPlaceholder = computed(() => {
  if (draft.implementationType === 'class') return 'com.example.listener.ApproveListener'
  if (draft.implementationType === 'delegateExpression') return '${approveListener}'
  return '${listenerService.onComplete(task)}'
})

const listenerRules = computed(() => ({
  event: [
    { required: true, message: t('bpm.modeler.listener.validation.event'), trigger: 'change' },
  ],
  implementationType: [
    {
      required: true,
      message: t('bpm.modeler.listener.validation.implementationType'),
      trigger: 'change',
    },
  ],
  implementation: [
    {
      required: true,
      message: t('bpm.modeler.listener.validation.implementation'),
      trigger: 'blur',
    },
  ],
}))

/** 以元素类型归一化：流程/连线只能是执行监听器，连线事件固定 take */
function open(listener?: ListenerConfig) {
  const next = listener
    ? cloneListener(listener)
    : createEmptyListener(
        props.isSequenceFlow ? 'execution' : props.allowTaskListener ? 'task' : 'execution',
      )

  if (props.isSequenceFlow) {
    next.listenerType = 'execution'
    next.event = 'take'
  } else if (!props.allowTaskListener) {
    next.listenerType = 'execution'
    if (!['start', 'end'].includes(next.event)) next.event = 'start'
  }

  Object.assign(draft, next)
  editingId.value = listener?.id ?? ''
  visible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

function resetListenerEvent() {
  draft.event = draft.listenerType === 'task' ? 'create' : 'start'
}

function addListenerField() {
  draft.fields.push({
    name: '',
    valueType: 'stringValue',
    value: '',
    expressionParameters: {},
  })
}

function setListenerParameter(key: string, value: string) {
  if (!draft.expressionParameters) draft.expressionParameters = {}
  draft.expressionParameters[key] = value
}

function applyListenerConfig() {
  const resolved = expressionCatalog.value.resolve(
    draft.expressionConfigKey,
    draft.expressionParameters ?? {},
  )
  draft.expressionParameters = resolved.parameters
  draft.implementation = resolved.expression
}

function applyFieldConfig(field: ListenerConfig['fields'][number]) {
  const resolved = expressionCatalog.value.resolve(
    field.expressionConfigKey,
    field.expressionParameters ?? {},
  )
  field.expressionParameters = resolved.parameters
  field.value = resolved.expression
}

async function handleSave() {
  await formRef.value?.validate()
  if (props.isSequenceFlow) draft.listenerType = 'execution'
  emit('save', cloneListener(draft))
  visible.value = false
}

defineExpose({ open })
</script>

<style lang="scss">
.listener-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--p-space-3-5);
}
.listener-form-grid .el-form-item {
  min-width: 0;
}
.full-width {
  width: 100%;
}
.field-editor-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: var(--p-space-2) 0 var(--p-space-2-5);
}
.field-editor-heading > div {
  display: grid;
}
.field-editor-heading strong {
  color: var(--theme-text-primary);
  font-size: var(--p-text-sm);
}
.field-editor-heading span {
  margin-top: var(--p-space-0-5);
  color: var(--theme-text-muted);
  font-size: var(--p-text-xs);
}
.field-editor-list {
  display: grid;
  gap: var(--p-space-2);
}
.field-editor-row {
  display: grid;
  grid-template-columns: 1fr 105px 1.2fr 28px;
  align-items: center;
  gap: 7px;
}
.field-type-select {
  width: 105px;
}
.field-remove {
  font-size: var(--p-text-lg);
}
.field-editor-empty {
  padding: var(--p-space-4-5);
  color: var(--theme-text-muted);
  font-size: var(--p-text-xs);
  text-align: center;
  border: 1px dashed var(--theme-border);
  border-radius: var(--p-radius-lg);
  background: var(--theme-bg-surface);
}

@include sm {
  .listener-form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .field-editor-row {
    grid-template-columns: 1fr 100px 28px;
  }
  .field-editor-row > .el-input:nth-child(3) {
    grid-column: 1 / 3;
  }
}
</style>
