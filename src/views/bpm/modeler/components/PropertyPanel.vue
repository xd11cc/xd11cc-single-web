<template>
  <aside class="property-panel">
    <div class="panel-heading">
      <div>
        <span class="eyebrow">{{ t('bpm.modeler.property.inspector') }}</span>
        <h2>{{ t('bpm.modeler.property.title') }}</h2>
      </div>
      <span v-if="element" class="type-pill">{{ elementTypeLabel }}</span>
    </div>

    <div v-if="!element" class="empty-panel">
      <div class="empty-icon"><Icon icon="lucide:mouse-pointer-click" /></div>
      <strong>{{ t('bpm.modeler.property.emptyTitle') }}</strong>
      <p>{{ t('bpm.modeler.property.emptyDescription') }}</p>
    </div>

    <el-form v-else label-position="top" class="property-form">
      <div class="panel-section">
        <div class="section-title">{{ t('bpm.modeler.property.sections.basic') }}</div>
        <el-form-item :label="t('bpm.modeler.property.fields.nodeName')">
          <el-input v-model="form.name" :placeholder="t('bpm.modeler.property.placeholders.nodeName')" @change="update('name')" />
        </el-form-item>
        <el-form-item :label="t('bpm.modeler.property.fields.nodeId')">
          <el-input v-model="form.id" @change="update('id')" />
        </el-form-item>
      </div>

      <div v-if="isUserTask" class="panel-section">
        <div class="section-title">{{ t('bpm.modeler.property.sections.approval') }}</div>
        <el-form-item :label="t('bpm.modeler.property.fields.approvalMode')">
          <div class="approval-mode-grid">
            <button
              v-for="option in approvalModeOptions"
              :key="option.value"
              type="button"
              class="approval-mode-card"
              :class="{ active: form.approvalMode === option.value }"
              @click="changeApprovalMode(option.value)"
            >
              <Icon :icon="option.icon" />
              <span><strong>{{ t(option.labelKey) }}</strong>{{ t(option.descriptionKey) }}</span>
            </button>
          </div>
        </el-form-item>

        <template v-if="form.approvalMode === 'single'">
          <el-form-item :label="t('bpm.modeler.property.fields.assignee')">
            <el-input
              v-model="form.assignee"
              :placeholder="t('bpm.modeler.property.placeholders.assignee')"
              @change="update('flowable:assignee')"
            />
            <div class="field-help">{{ t('bpm.modeler.property.help.assignee') }}</div>
          </el-form-item>
          <el-form-item :label="t('bpm.modeler.property.fields.candidateUsers')">
            <el-input
              v-model="form.candidateUsers"
              :placeholder="t('bpm.modeler.property.placeholders.candidateUsers')"
              @change="update('flowable:candidateUsers')"
            />
          </el-form-item>
          <el-form-item :label="t('bpm.modeler.property.fields.candidateGroups')">
            <el-input
              v-model="form.candidateGroups"
              :placeholder="t('bpm.modeler.property.placeholders.candidateGroups')"
              @change="update('flowable:candidateGroups')"
            />
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item :label="t('bpm.modeler.property.fields.approverCollection')">
            <el-input
              v-model="form.collection"
              :placeholder="t('bpm.modeler.property.placeholders.collection')"
              @change="updateApprovalConfig"
            />
            <div class="field-help">{{ t('bpm.modeler.property.help.collection') }}</div>
          </el-form-item>
          <el-form-item :label="t('bpm.modeler.property.fields.elementVariable')">
            <el-input v-model="form.elementVariable" :placeholder="t('bpm.modeler.property.placeholders.elementVariable')" @change="updateApprovalConfig" />
            <div class="field-help">{{ t('bpm.modeler.property.help.elementVariable') }}</div>
          </el-form-item>
          <div class="approval-runtime-note">
            <Icon icon="lucide:braces" />
            <span>
              {{ t('bpm.modeler.property.help.automaticAssignee') }}
              <code>{{ assigneeExpression }}</code>
            </span>
          </div>
        </template>

        <el-form-item :label="t('bpm.modeler.property.fields.formKey')">
          <el-input
            v-model="form.formKey"
            :placeholder="t('bpm.modeler.property.placeholders.formKey')"
            @change="update('flowable:formKey')"
          />
        </el-form-item>
      </div>

      <div v-if="isUserTask" class="panel-section listener-section">
        <div class="section-heading-row">
          <div>
            <div class="section-title">{{ t('bpm.modeler.property.sections.listeners') }}</div>
            <div class="section-caption">{{ t('bpm.modeler.listener.caption') }}</div>
          </div>
          <el-button size="small" text bg type="primary" @click="openListenerDialog()">
            <Icon icon="lucide:plus" />{{ t('bpm.modeler.actions.add') }}
          </el-button>
        </div>

        <div v-if="listeners.length" class="listener-list">
          <div v-for="listener in listeners" :key="listener.id" class="listener-card">
            <div class="listener-card-main">
              <span class="listener-kind" :class="listener.listenerType">
                {{ t(`bpm.modeler.listener.${listener.listenerType}`) }}
              </span>
              <div class="listener-copy">
                <div class="listener-event">{{ listenerEventLabel(listener) }}</div>
                <div class="listener-implementation" :title="listener.implementation">
                  {{ t(implementationTypeLabel[listener.implementationType]) }} ·
                  {{ listener.implementation || t('bpm.modeler.listener.unconfigured') }}
                </div>
                <div v-if="listener.fields.length" class="listener-fields">
                  {{ t('bpm.modeler.listener.fieldCount', { count: listener.fields.length }) }}
                </div>
              </div>
            </div>
            <div class="listener-actions">
              <button :title="t('bpm.modeler.listener.edit')" @click="openListenerDialog(listener)">
                <Icon icon="lucide:pencil" />
              </button>
              <button class="danger" :title="t('bpm.modeler.listener.delete')" @click="removeListener(listener.id)">
                <Icon icon="lucide:trash-2" />
              </button>
            </div>
          </div>
        </div>

        <button v-else type="button" class="listener-empty" @click="openListenerDialog()">
          <Icon icon="lucide:radio-tower" />
          <span><strong>{{ t('bpm.modeler.listener.emptyTitle') }}</strong>{{ t('bpm.modeler.listener.emptyDescription') }}</span>
          <Icon icon="lucide:arrow-right" />
        </button>
      </div>

      <div v-if="isServiceTask" class="panel-section">
        <div class="section-title">{{ t('bpm.modeler.property.sections.service') }}</div>
        <el-form-item :label="t('bpm.modeler.property.fields.javaClass')">
          <el-input
            v-model="form.serviceClass"
            :placeholder="t('bpm.modeler.property.placeholders.javaClass')"
            @change="update('flowable:class')"
          />
        </el-form-item>
        <el-form-item :label="t('bpm.modeler.property.fields.delegateExpression')">
          <el-input
            v-model="form.delegateExpression"
            :placeholder="t('bpm.modeler.property.placeholders.delegateExpression')"
            @change="update('flowable:delegateExpression')"
          />
        </el-form-item>
      </div>

      <div v-if="isSequenceFlow" class="panel-section">
        <div class="section-title">{{ t('bpm.modeler.property.sections.condition') }}</div>
        <el-form-item :label="t('bpm.modeler.property.fields.conditionExpression')">
          <el-input
            v-model="form.condition"
            type="textarea"
            :rows="3"
            :placeholder="t('bpm.modeler.property.placeholders.condition')"
            @change="updateCondition"
          />
        </el-form-item>
      </div>

      <div class="panel-section metadata-section">
        <div class="section-title">{{ t('bpm.modeler.property.sections.technical') }}</div>
        <div class="metadata-row"><span>{{ t('bpm.modeler.property.fields.bpmnType') }}</span><code>{{ element.type }}</code></div>
      </div>
    </el-form>

    <el-dialog
      v-model="listenerDialogVisible"
      :title="t(editingListenerId ? 'bpm.modeler.listener.dialogEdit' : 'bpm.modeler.listener.dialogAdd')"
      width="560px"
      append-to-body
      destroy-on-close
    >
      <el-form ref="listenerFormRef" :model="listenerDraft" :rules="listenerRules" label-position="top">
        <div class="listener-form-grid">
          <el-form-item :label="t('bpm.modeler.listener.type')" prop="listenerType">
            <el-radio-group v-model="listenerDraft.listenerType" @change="resetListenerEvent">
              <el-radio-button value="task">{{ t('bpm.modeler.listener.taskListener') }}</el-radio-button>
              <el-radio-button value="execution">{{ t('bpm.modeler.listener.executionListener') }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item :label="t('bpm.modeler.listener.event')" prop="event">
            <el-select v-model="listenerDraft.event" class="full-width">
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
          <el-select v-model="listenerDraft.implementationType" class="full-width">
            <el-option :label="t('bpm.modeler.listener.implementationTypes.class')" value="class" />
            <el-option :label="t('bpm.modeler.listener.implementationTypes.expression')" value="expression" />
            <el-option :label="t('bpm.modeler.listener.implementationTypes.delegateExpression')" value="delegateExpression" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('bpm.modeler.listener.implementation')" prop="implementation">
          <el-input
            v-model="listenerDraft.implementation"
            :placeholder="implementationPlaceholder"
          />
        </el-form-item>

        <div class="field-editor-heading">
          <div>
            <strong>{{ t('bpm.modeler.listener.fieldInjection') }}</strong>
            <span>{{ t('bpm.modeler.listener.fieldInjectionHelp') }}</span>
          </div>
          <el-button size="small" text bg @click="addListenerField">
            <Icon icon="lucide:plus" />{{ t('bpm.modeler.actions.addField') }}
          </el-button>
        </div>
        <div v-if="listenerDraft.fields.length" class="field-editor-list">
          <div v-for="(field, index) in listenerDraft.fields" :key="index" class="field-editor-row">
            <el-input v-model="field.name" :placeholder="t('bpm.modeler.listener.fieldName')" />
            <el-select v-model="field.valueType" class="field-type-select">
              <el-option :label="t('bpm.modeler.listener.valueTypes.string')" value="stringValue" />
              <el-option :label="t('bpm.modeler.listener.valueTypes.expression')" value="expression" />
            </el-select>
            <el-input
              v-model="field.value"
              :placeholder="field.valueType === 'expression' ? '${variable}' : t('bpm.modeler.listener.fieldValue')"
            />
            <button type="button" class="field-remove" @click="listenerDraft.fields.splice(index, 1)">
              <Icon icon="lucide:x" />
            </button>
          </div>
        </div>
        <div v-else class="field-editor-empty">{{ t('bpm.modeler.listener.noFields') }}</div>
      </el-form>
      <template #footer>
        <el-button @click="listenerDialogVisible = false">{{ t('bpm.modeler.actions.cancel') }}</el-button>
        <el-button type="primary" @click="saveListener">{{ t('bpm.modeler.actions.saveListener') }}</el-button>
      </template>
    </el-dialog>
  </aside>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  element: any | null
}>()

const emit = defineEmits<{
  update: [properties: Record<string, unknown>]
  updateListeners: [listeners: ListenerConfig[]]
  updateApproval: [config: {
    mode: ApprovalMode
    collection: string
    elementVariable: string
  }]
}>()

type ListenerField = {
  name: string
  valueType: 'stringValue' | 'expression'
  value: string
}

type ListenerConfig = {
  id: string
  listenerType: 'task' | 'execution'
  event: string
  implementationType: 'class' | 'expression' | 'delegateExpression'
  implementation: string
  fields: ListenerField[]
}

type ApprovalMode = 'single' | 'countersign' | 'orsign'

const form = reactive({
  id: '',
  name: '',
  assignee: '',
  candidateUsers: '',
  candidateGroups: '',
  formKey: '',
  approvalMode: 'single' as ApprovalMode,
  collection: '${approverList}',
  elementVariable: 'approver',
  serviceClass: '',
  delegateExpression: '',
  condition: '',
})

const approvalModeOptions: Array<{
  value: ApprovalMode
  labelKey: string
  descriptionKey: string
  icon: string
}> = [
  { value: 'single', labelKey: 'bpm.modeler.property.approvalModes.single.label', descriptionKey: 'bpm.modeler.property.approvalModes.single.description', icon: 'lucide:user' },
  { value: 'countersign', labelKey: 'bpm.modeler.property.approvalModes.countersign.label', descriptionKey: 'bpm.modeler.property.approvalModes.countersign.description', icon: 'lucide:users' },
  { value: 'orsign', labelKey: 'bpm.modeler.property.approvalModes.orsign.label', descriptionKey: 'bpm.modeler.property.approvalModes.orsign.description', icon: 'lucide:user-check' },
]

const isUserTask = computed(() => props.element?.type === 'bpmn:UserTask')
const isServiceTask = computed(() => props.element?.type === 'bpmn:ServiceTask')
const isSequenceFlow = computed(() => props.element?.type === 'bpmn:SequenceFlow')
const listeners = ref<ListenerConfig[]>([])
const listenerDialogVisible = ref(false)
const editingListenerId = ref('')
const listenerFormRef = useTemplateRef<any>('listenerFormRef')
const listenerDraft = reactive<ListenerConfig>(createEmptyListener())

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
const currentEventOptions = computed(() =>
  listenerDraft.listenerType === 'task' ? taskEventOptions : executionEventOptions,
)
const implementationTypeLabel = {
  class: 'bpm.modeler.listener.implementationTypes.class',
  expression: 'bpm.modeler.listener.implementationTypes.expression',
  delegateExpression: 'bpm.modeler.listener.implementationTypes.delegateExpression',
}
const implementationPlaceholder = computed(() => {
  if (listenerDraft.implementationType === 'class') return 'com.example.listener.ApproveListener'
  if (listenerDraft.implementationType === 'delegateExpression') return '${approveListener}'
  return '${listenerService.onComplete(task)}'
})
const assigneeExpression = computed(() => `\${${form.elementVariable}}`)
const listenerRules = computed(() => ({
  event: [{ required: true, message: t('bpm.modeler.listener.validation.event'), trigger: 'change' }],
  implementationType: [{ required: true, message: t('bpm.modeler.listener.validation.implementationType'), trigger: 'change' }],
  implementation: [{ required: true, message: t('bpm.modeler.listener.validation.implementation'), trigger: 'blur' }],
}))

const typeLabels: Record<string, string> = {
  'bpmn:StartEvent': 'bpm.modeler.property.elementTypes.startEvent',
  'bpmn:EndEvent': 'bpm.modeler.property.elementTypes.endEvent',
  'bpmn:UserTask': 'bpm.modeler.property.elementTypes.userTask',
  'bpmn:ServiceTask': 'bpm.modeler.property.elementTypes.serviceTask',
  'bpmn:ExclusiveGateway': 'bpm.modeler.property.elementTypes.exclusiveGateway',
  'bpmn:ParallelGateway': 'bpm.modeler.property.elementTypes.parallelGateway',
  'bpmn:SequenceFlow': 'bpm.modeler.property.elementTypes.sequenceFlow',
  'bpmn:Process': 'bpm.modeler.property.elementTypes.process',
}

const elementTypeLabel = computed(
  () => typeLabels[props.element?.type]
    ? t(typeLabels[props.element?.type])
    : props.element?.type?.replace('bpmn:', '') ?? '',
)

watch(
  () => props.element,
  (element) => {
    const businessObject = element?.businessObject
    form.id = businessObject?.id ?? ''
    form.name = businessObject?.name ?? ''
    form.assignee = businessObject?.get?.('flowable:assignee') ?? ''
    form.candidateUsers = businessObject?.get?.('flowable:candidateUsers') ?? ''
    form.candidateGroups = businessObject?.get?.('flowable:candidateGroups') ?? ''
    form.formKey = businessObject?.get?.('flowable:formKey') ?? ''
    const loopCharacteristics = businessObject?.loopCharacteristics
    form.approvalMode = readApprovalMode(businessObject)
    form.collection =
      loopCharacteristics?.get?.('flowable:collection') ??
      '${approverList}'
    form.elementVariable =
      loopCharacteristics?.get?.('flowable:elementVariable') ??
      'approver'
    form.serviceClass = businessObject?.get?.('flowable:class') ?? ''
    form.delegateExpression = businessObject?.get?.('flowable:delegateExpression') ?? ''
    form.condition = businessObject?.conditionExpression?.body ?? ''
    listeners.value = readListeners(businessObject)
  },
  { immediate: true },
)

function update(property: string) {
  const fieldMap: Record<string, keyof typeof form> = {
    id: 'id',
    name: 'name',
    'flowable:assignee': 'assignee',
    'flowable:candidateUsers': 'candidateUsers',
    'flowable:candidateGroups': 'candidateGroups',
    'flowable:formKey': 'formKey',
    'flowable:class': 'serviceClass',
    'flowable:delegateExpression': 'delegateExpression',
  }
  emit('update', { [property]: form[fieldMap[property]] || undefined })
}

function readApprovalMode(businessObject: any): ApprovalMode {
  const savedMode = businessObject?.get?.('flowable:approvalMode')
  if (['single', 'countersign', 'orsign'].includes(savedMode)) return savedMode
  const loop = businessObject?.loopCharacteristics
  if (!loop) return 'single'
  return loop.completionCondition?.body?.includes('nrOfCompletedInstances > 0')
    ? 'orsign'
    : 'countersign'
}

function changeApprovalMode(mode: ApprovalMode) {
  form.approvalMode = mode
  if (mode !== 'single' && !form.collection) {
    form.collection = '${approverList}'
  }
  if (!form.elementVariable) {
    form.elementVariable = 'approver'
  }
  updateApprovalConfig()
}

function updateApprovalConfig() {
  emit('updateApproval', {
    mode: form.approvalMode,
    collection: form.collection,
    elementVariable: form.elementVariable,
  })
}

function updateCondition() {
  emit('update', {
    conditionExpression: form.condition
      ? {
          $type: 'bpmn:FormalExpression',
          body: form.condition,
        }
      : undefined,
  })
}

function createEmptyListener(): ListenerConfig {
  return {
    id: `listener_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    listenerType: 'task',
    event: 'create',
    implementationType: 'class',
    implementation: '',
    fields: [],
  }
}

function readListeners(businessObject: any): ListenerConfig[] {
  return (businessObject?.extensionElements?.values ?? [])
    .filter(
      (value: any) =>
        value.$type === 'flowable:TaskListener' || value.$type === 'flowable:ExecutionListener',
    )
    .map((value: any, index: number) => {
      const implementationType = value.class
        ? 'class'
        : value.delegateExpression
          ? 'delegateExpression'
          : 'expression'
      return {
        id: `${value.$type}_${index}_${value.event ?? 'event'}`,
        listenerType: value.$type === 'flowable:TaskListener' ? 'task' : 'execution',
        event: value.event ?? (value.$type === 'flowable:TaskListener' ? 'create' : 'start'),
        implementationType,
        implementation: value[implementationType] ?? '',
        fields: (value.fields ?? []).map((field: any) => ({
          name: field.name ?? '',
          valueType: field.expression !== undefined ? 'expression' : 'stringValue',
          value: field.expression ?? field.stringValue ?? '',
        })),
      } as ListenerConfig
    })
}

function resetListenerEvent() {
  listenerDraft.event = listenerDraft.listenerType === 'task' ? 'create' : 'start'
}

function openListenerDialog(listener?: ListenerConfig) {
  const next = listener
    ? {
        ...listener,
        fields: listener.fields.map((field) => ({ ...field })),
      }
    : createEmptyListener()
  Object.assign(listenerDraft, next)
  editingListenerId.value = listener?.id ?? ''
  listenerDialogVisible.value = true
  nextTick(() => listenerFormRef.value?.clearValidate())
}

function addListenerField() {
  listenerDraft.fields.push({ name: '', valueType: 'stringValue', value: '' })
}

async function saveListener() {
  await listenerFormRef.value?.validate()
  const nextListener: ListenerConfig = {
    ...listenerDraft,
    fields: listenerDraft.fields.map((field) => ({ ...field })),
  }
  const index = listeners.value.findIndex((listener) => listener.id === editingListenerId.value)
  if (index >= 0) listeners.value.splice(index, 1, nextListener)
  else listeners.value.push(nextListener)
  emit('updateListeners', listeners.value.map((listener) => ({
    ...listener,
    fields: listener.fields.map((field) => ({ ...field })),
  })))
  listenerDialogVisible.value = false
}

function removeListener(id: string) {
  listeners.value = listeners.value.filter((listener) => listener.id !== id)
  emit('updateListeners', listeners.value)
}

function listenerEventLabel(listener: ListenerConfig) {
  const options = listener.listenerType === 'task' ? taskEventOptions : executionEventOptions
  const key = options.find((option) => option.value === listener.event)?.key
  return key ? t(key) : listener.event
}
</script>

<style lang="scss" scoped>
.property-panel {
  height: 100%;
  overflow: auto;
  color: #25343d;
  background: #fff;
}

.panel-heading {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #edf1f3;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);

  h2 { margin: 3px 0 0; font-size: 18px; letter-spacing: -0.02em; }
}

.eyebrow { color: #0b8f68; font-size: 10px; font-weight: 700; letter-spacing: 0.16em; }
.type-pill { padding: 5px 8px; color: #087f5b; font-size: 11px; font-weight: 600; border-radius: 7px; background: #e8f7f1; }

.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 28px 0;
  text-align: center;

  strong { margin-top: 16px; font-size: 15px; }
  p { max-width: 220px; margin: 8px 0; color: #8a99a2; font-size: 12px; line-height: 1.7; }
}

.empty-icon {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  color: #0b8f68;
  font-size: 23px;
  border: 1px solid #cfe9df;
  border-radius: 16px;
  background: #f0faf6;
}

.property-form { padding-bottom: 24px; }
.panel-section { padding: 18px 20px 4px; border-bottom: 1px solid #edf1f3; }
.section-title { margin-bottom: 15px; color: #6d7d86; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.field-help { margin-top: 5px; color: #9aa7ae; font-size: 11px; line-height: 1.5; }
.field-help code { color: #087f5b; font-size: 10px; }
.approval-mode-grid { display: grid; width: 100%; grid-template-columns: 1fr 1fr; gap: 7px; }
.approval-mode-card { display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 9px 10px; color: #64747c; text-align: left; border: 1px solid #dfe6e9; border-radius: 9px; background: #fff; cursor: pointer; transition: .16s ease; }
.approval-mode-card > svg { flex: 0 0 auto; font-size: 17px; }
.approval-mode-card span { display: grid; color: #8b989f; font-size: 9px; line-height: 1.35; }
.approval-mode-card strong { color: #43545c; font-size: 11px; }
.approval-mode-card:hover { border-color: #b8d7cc; background: #f7fbf9; }
.approval-mode-card.active { color: #087f5b; border-color: #73b6a0; background: #ecf8f3; box-shadow: 0 0 0 1px rgba(8, 127, 91, .08); }
.approval-mode-card.active strong { color: #087f5b; }
.approval-runtime-note { display: flex; align-items: flex-start; gap: 8px; margin: -4px 0 17px; padding: 9px 10px; color: #71828a; font-size: 10px; line-height: 1.5; border-radius: 8px; background: #f3f7f6; }
.approval-runtime-note > svg { flex: 0 0 auto; margin-top: 1px; color: #0b8f68; }
.approval-runtime-note code { color: #087f5b; font-weight: 600; }
.section-heading-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.section-heading-row .section-title { margin-bottom: 3px; }
.section-caption { color: #9aa7ae; font-size: 11px; }
.listener-section { padding-bottom: 18px; }
.listener-list { display: grid; gap: 8px; }
.listener-card { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 11px; border: 1px solid #e1e8eb; border-radius: 10px; background: #fbfcfc; transition: .16s ease; }
.listener-card:hover { border-color: #c8ddd5; box-shadow: 0 5px 14px rgba(25, 72, 58, .06); }
.listener-card-main { display: flex; min-width: 0; gap: 9px; }
.listener-kind { flex: 0 0 auto; height: 21px; padding: 3px 6px; color: #087f5b; font-size: 9px; font-weight: 700; border-radius: 5px; background: #e7f6f0; }
.listener-kind.execution { color: #94611b; background: #fff3dc; }
.listener-copy { min-width: 0; }
.listener-event { color: #33444d; font-size: 12px; font-weight: 650; }
.listener-implementation { max-width: 165px; margin-top: 3px; overflow: hidden; color: #7f8d95; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.listener-fields { margin-top: 4px; color: #0b8f68; font-size: 9px; }
.listener-actions { display: flex; flex: 0 0 auto; gap: 2px; }
.listener-actions button, .field-remove { display: grid; width: 25px; height: 25px; place-items: center; color: #7b8a92; border: 0; border-radius: 6px; background: transparent; cursor: pointer; }
.listener-actions button:hover { color: #087f5b; background: #e9f6f1; }
.listener-actions button.danger:hover, .field-remove:hover { color: #c33c3c; background: #fff0f0; }
.listener-empty { display: flex; width: 100%; align-items: center; gap: 10px; padding: 13px 11px; color: #0b8f68; text-align: left; border: 1px dashed #bcd8ce; border-radius: 10px; background: #f5fbf8; cursor: pointer; }
.listener-empty > svg:last-child { margin-left: auto; }
.listener-empty span { display: grid; color: #8a999f; font-size: 10px; }
.listener-empty strong { margin-bottom: 2px; color: #405159; font-size: 11px; }
.metadata-section { border-bottom: 0; }
.metadata-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding-bottom: 14px; color: #839098; font-size: 12px; }
.metadata-row code { color: #52636d; font-size: 11px; word-break: break-all; }

:deep(.el-form-item) { margin-bottom: 17px; }
:deep(.el-form-item__label) { color: #53636c; font-size: 12px; font-weight: 600; }
:deep(.el-input__wrapper), :deep(.el-textarea__inner) { box-shadow: 0 0 0 1px #dfe6ea inset; }
:deep(.el-input__wrapper.is-focus), :deep(.el-textarea__inner:focus) { box-shadow: 0 0 0 1px #0b8f68 inset; }
</style>

<style lang="scss">
.listener-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.listener-form-grid .el-form-item { min-width: 0; }
.full-width { width: 100%; }
.field-editor-heading { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 10px; }
.field-editor-heading > div { display: grid; }
.field-editor-heading strong { color: #3d4d55; font-size: 12px; }
.field-editor-heading span { margin-top: 2px; color: #98a5ab; font-size: 10px; }
.field-editor-list { display: grid; gap: 8px; }
.field-editor-row { display: grid; grid-template-columns: 1fr 105px 1.2fr 28px; align-items: center; gap: 7px; }
.field-type-select { width: 105px; }
.field-remove { font-size: 15px; }
.field-editor-empty { padding: 18px; color: #9aa7ae; font-size: 11px; text-align: center; border: 1px dashed #dce4e7; border-radius: 8px; background: #fafbfb; }

@media (max-width: 620px) {
  .listener-form-grid { grid-template-columns: 1fr; gap: 0; }
  .field-editor-row { grid-template-columns: 1fr 100px 28px; }
  .field-editor-row > .el-input:nth-child(3) { grid-column: 1 / 3; }
}
</style>
