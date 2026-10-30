<template>
  <aside class="property-panel">
    <div class="panel-heading">
      <div>
        <span class="eyebrow">{{ t('bpm.modeler.property.inspector') }}</span>
        <h2>{{ panelTitle }}</h2>
      </div>
      <span v-if="element" class="type-pill">{{ elementTypeLabel }}</span>
    </div>

    <div v-if="!element" class="empty-panel">
      <div class="empty-icon"><Icon icon="lucide:mouse-pointer-click" /></div>
      <strong>{{ t('bpm.modeler.property.emptyTitle') }}</strong>
      <p>{{ t('bpm.modeler.property.emptyDescription') }}</p>
    </div>

    <el-form v-else label-position="left" :label-width="propertyLabelWidth" class="property-form">
      <BasicSection />
      <UserTaskPanel v-if="isUserTask" />
      <SequenceFlowPanel v-if="isSequenceFlow" />
      <ListenerSection
        v-if="isUserTask || isProcess || isSequenceFlow"
        :listeners="listeners"
        :is-process="isProcess"
        :allow-task-listener="isUserTask"
        :is-sequence-flow="isSequenceFlow"
        :expression-options="expressionOptions"
        :process-variable-options="processVariableOptions"
        @save="handleSaveListener"
        @remove="handleRemoveListener"
      />
      <ServiceTaskPanel v-if="isServiceTask" />
      <MetadataSection />
    </el-form>
  </aside>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { getExpressionConfigOptions } from '../../expression-config/apis'
import { workflowCategoryList } from '../../category/apis'
import { userList } from '@/views/system/user/apis'
import { roleList } from '@/views/system/role/apis'
import { createExpressionCatalog } from '../expression-catalog'
import type { ApprovalConfig, ApprovalMode, ListenerConfig, ListenerField } from '../types'
import {
  cloneListener,
  createEmptyListener,
  parseJsonArray,
  parseJsonObject,
  readListeners,
} from '../listener-io'
import { useElementForm } from '../useElementForm'
import ListenerSection from './ListenerSection.vue'
import BasicSection from './BasicSection.vue'
import UserTaskPanel from './UserTaskPanel.vue'
import SequenceFlowPanel from './SequenceFlowPanel.vue'
import ServiceTaskPanel from './ServiceTaskPanel.vue'
import MetadataSection from './MetadataSection.vue'
import { ELEMENT_CONTEXT } from '../element-context'
import type { WorkflowExpressionConfigVO } from '../../expression-config/apis/type'

const { t, locale } = useI18n()

const props = defineProps<{
  element: any | null
}>()

const emit = defineEmits<{
  update: [properties: Record<string, unknown>]
  updateListeners: [listeners: ListenerConfig[]]
  updateApproval: [config: ApprovalConfig]
}>()

const approvalModeOptions: Array<{
  value: ApprovalMode
  labelKey: string
  descriptionKey: string
  icon: string
}> = [
  {
    value: 'single',
    labelKey: 'bpm.modeler.property.approvalModes.single.label',
    descriptionKey: 'bpm.modeler.property.approvalModes.single.description',
    icon: 'lucide:user',
  },
  {
    value: 'countersign',
    labelKey: 'bpm.modeler.property.approvalModes.countersign.label',
    descriptionKey: 'bpm.modeler.property.approvalModes.countersign.description',
    icon: 'lucide:users',
  },
  {
    value: 'orsign',
    labelKey: 'bpm.modeler.property.approvalModes.orsign.label',
    descriptionKey: 'bpm.modeler.property.approvalModes.orsign.description',
    icon: 'lucide:user-check',
  },
]

const elementBpmnType = computed(
  () => props.element?.businessObject?.$type ?? props.element?.type ?? '',
)
const isUserTask = computed(() => ['bpmn:UserTask', 'bpmn:Task'].includes(elementBpmnType.value))
const isServiceTask = computed(() => elementBpmnType.value === 'bpmn:ServiceTask')
const isSequenceFlow = computed(() => elementBpmnType.value === 'bpmn:SequenceFlow')
const isProcess = computed(() => elementBpmnType.value === 'bpmn:Process')
const propertyLabelWidth = computed(() => (locale.value.startsWith('zh') ? '82px' : '112px'))
const panelTitle = computed(() =>
  t(isProcess.value ? 'bpm.modeler.property.processTitle' : 'bpm.modeler.property.title'),
)
type SelectOption = { label: string; value: string }

const processCategoryOptions = ref<Array<{ label: string; value: string }>>([])
const candidateUserOptions = ref<SelectOption[]>([])
const candidateGroupOptions = ref<SelectOption[]>([])
const candidateUsersLoading = ref(false)
const candidateGroupsLoading = ref(false)
const expressionOptions = ref<WorkflowExpressionConfigVO[]>([])
const expressionCatalog = computed(() => createExpressionCatalog(expressionOptions.value))
// 元素读写桥：form 镜像、processVariables、update 系列都来自 useElementForm
const {
  form,
  processVariables,
  update,
  updateProcessDescription,
  updateCandidateUsers,
  updateCandidateGroups,
  updateApprovalConfig,
  changeApprovalMode,
  updateCondition,
} = useElementForm(() => props.element, {
  update: (properties) => emit('update', properties),
  updateApproval: (config) => emit('updateApproval', config),
})

const systemProcessVariables = [
  { key: 'initiatorId', name: 'Initiator ID' },
  { key: 'tenantId', name: 'Tenant ID' },
  { key: 'businessKey', name: 'Business Key' },
  { key: 'processInstanceId', name: 'Process Instance ID' },
]
const processVariableOptions = computed(() =>
  [...systemProcessVariables, ...processVariables.value].map((item) => ({
    label: `${item.name} (${item.key})`,
    value: item.key,
  })),
)
const listeners = ref<ListenerConfig[]>([])
const typeLabels: Record<string, string> = {
  'bpmn:StartEvent': 'bpm.modeler.property.elementTypes.startEvent',
  'bpmn:EndEvent': 'bpm.modeler.property.elementTypes.endEvent',
  'bpmn:Task': 'bpm.modeler.property.elementTypes.userTask',
  'bpmn:UserTask': 'bpm.modeler.property.elementTypes.userTask',
  'bpmn:ServiceTask': 'bpm.modeler.property.elementTypes.serviceTask',
  'bpmn:ExclusiveGateway': 'bpm.modeler.property.elementTypes.exclusiveGateway',
  'bpmn:ParallelGateway': 'bpm.modeler.property.elementTypes.parallelGateway',
  'bpmn:SequenceFlow': 'bpm.modeler.property.elementTypes.sequenceFlow',
  'bpmn:Process': 'bpm.modeler.property.elementTypes.process',
}

const elementTypeLabel = computed(() =>
  typeLabels[elementBpmnType.value]
    ? t(typeLabels[elementBpmnType.value])
    : elementBpmnType.value.replace('bpmn:', ''),
)

// 监听器列表独立于 form：第三期会整体搬到 ListenerSection
watch(
  () => props.element,
  (element) => {
    const businessObject = element?.businessObject
    listeners.value = readListeners(businessObject)
  },
  { immediate: true },
)

/** 监听器保存：新增或按 id 替换，并回写给设计器 */
function handleSaveListener(listener: ListenerConfig) {
  const index = listeners.value.findIndex((item) => item.id === listener.id)
  if (index >= 0) listeners.value.splice(index, 1, listener)
  else listeners.value.push(listener)
  emit('updateListeners', listeners.value)
}

function handleRemoveListener(id: string) {
  listeners.value = listeners.value.filter((item) => item.id !== id)
  emit('updateListeners', listeners.value)
}

function applyCollectionConfig() {
  const resolved = expressionCatalog.value.resolve(
    form.collectionConfigKey,
    form.collectionParameters,
  )
  form.collectionParameters = resolved.parameters
  form.collection = resolved.expression
  updateApprovalConfig()
}

function applyConditionConfig() {
  const resolved = expressionCatalog.value.resolve(
    form.conditionConfigKey,
    form.conditionParameters,
  )
  form.conditionParameters = resolved.parameters
  form.condition = resolved.expression
  updateCondition()
}

function applyAssigneeExpression() {
  const resolved = expressionCatalog.value.resolve(form.assigneeConfigKey, form.assigneeParameters)
  form.assigneeParameters = resolved.parameters
  form.assignee = resolved.expression
  emit('update', {
    'flowable:assignee': form.assignee || undefined,
    'flowable:assigneeExpressionConfigKey': form.assigneeConfigKey || undefined,
    'flowable:assigneeExpressionParameters': form.assigneeConfigKey
      ? JSON.stringify(form.assigneeParameters)
      : undefined,
  })
}

async function loadProcessCategories() {
  try {
    const { data } = await workflowCategoryList()
    processCategoryOptions.value = (data ?? [])
      .filter((category) => Boolean(category.categoryCode && category.categoryName))
      .map((category) => ({
        value: category.categoryCode!,
        label: category.categoryName!,
      }))
  } catch {
    processCategoryOptions.value = []
  }
}

async function loadCandidateUsers() {
  candidateUsersLoading.value = true
  try {
    const { data } = await userList()
    candidateUserOptions.value = (data ?? [])
      .filter((user) => Boolean(user.username))
      .map((user) => ({
        value: user.username!,
        label: user.nickname ? `${user.nickname} (${user.username})` : user.username!,
      }))
  } catch {
    candidateUserOptions.value = []
  } finally {
    candidateUsersLoading.value = false
  }
}

async function loadCandidateGroups() {
  candidateGroupsLoading.value = true
  try {
    const { data } = await roleList()
    candidateGroupOptions.value = (data ?? [])
      .filter((role) => Boolean(role.roleCode))
      .map((role) => ({
        value: role.roleCode!,
        label: role.roleName ? `${role.roleName} (${role.roleCode})` : role.roleCode!,
      }))
  } catch {
    candidateGroupOptions.value = []
  } finally {
    candidateGroupsLoading.value = false
  }
}

async function loadExpressionOptions() {
  const expressionTypes = [
    'SEQUENCE_CONDITION',
    'ASSIGNEE',
    'MULTI_INSTANCE_USERS',
    'LISTENER_EXPRESSION',
  ] as const
  const responses = await Promise.allSettled(
    expressionTypes.map((expressionType) => getExpressionConfigOptions(expressionType)),
  )
  expressionOptions.value = responses.flatMap((result) =>
    result.status === 'fulfilled' ? (result.value.data ?? []) : [],
  )
}

// 把面板需要的一切显式声明成上下文，供四个按元素类型拆分的子面板注入
provide(ELEMENT_CONTEXT, {
  element: computed(() => props.element),
  form,
  isProcess,
  isUserTask,
  isServiceTask,
  isSequenceFlow,
  update,
  updateProcessDescription,
  updateCandidateUsers,
  updateCandidateGroups,
  updateApprovalConfig,
  changeApprovalMode,
  updateCondition,
  expressionCatalog,
  processVariableOptions,
  applyCollectionConfig,
  applyConditionConfig,
  applyAssigneeExpression,
  processCategoryOptions,
  candidateUserOptions,
  candidateGroupOptions,
  candidateUsersLoading,
  candidateGroupsLoading,
  loadCandidateUsers,
  loadCandidateGroups,
  approvalModeOptions,
  listeners,
})

onMounted(() => {
  void Promise.all([
    loadProcessCategories(),
    loadCandidateUsers(),
    loadCandidateGroups(),
    loadExpressionOptions(),
  ])
})
</script>

<style lang="scss">
@use './property-panel.scss';
</style>
