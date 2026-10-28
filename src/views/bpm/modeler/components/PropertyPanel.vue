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
      <div class="panel-section">
        <div class="section-title">{{ t('bpm.modeler.property.sections.basic') }}</div>
        <template v-if="isProcess">
          <el-form-item :label="t('bpm.modeler.property.fields.processKey')">
            <el-input
              v-model="form.id"
              :placeholder="t('bpm.modeler.property.placeholders.processKey')"
              @change="update('id')"
            />
          </el-form-item>
          <el-form-item :label="t('bpm.modeler.property.fields.processName')">
            <el-input
              v-model="form.name"
              :placeholder="t('bpm.modeler.property.placeholders.processName')"
              @change="update('name')"
            />
          </el-form-item>
          <el-form-item :label="t('bpm.modeler.property.fields.processCategory')">
            <el-select
              v-model="form.category"
              class="full-width"
              clearable
              filterable
              :placeholder="t('bpm.modeler.property.placeholders.processCategory')"
              @change="update('flowable:category')"
            >
              <el-option
                v-for="option in processCategoryOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <div class="field-help">{{ t('bpm.modeler.property.help.processCategory') }}</div>
          </el-form-item>
          <el-form-item :label="t('bpm.modeler.property.fields.processDescription')">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              maxlength="500"
              show-word-limit
              :placeholder="t('bpm.modeler.property.placeholders.processDescription')"
              @change="updateProcessDescription"
            />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item :label="t('bpm.modeler.property.fields.nodeName')">
            <el-input
              v-model="form.name"
              :placeholder="t('bpm.modeler.property.placeholders.nodeName')"
              @change="update('name')"
            />
          </el-form-item>
          <el-form-item :label="t('bpm.modeler.property.fields.nodeId')">
            <el-input v-model="form.id" @change="update('id')" />
          </el-form-item>
        </template>
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
              <span
                ><strong>{{ t(option.labelKey) }}</strong
                >{{ t(option.descriptionKey) }}</span
              >
            </button>
          </div>
        </el-form-item>

        <template v-if="form.approvalMode === 'single'">
          <el-form-item :label="t('bpm.modeler.property.fields.assignee')">
            <el-select
              v-model="form.assigneeConfigKey"
              class="full-width"
              clearable
              filterable
              :placeholder="t('bpm.modeler.property.placeholders.assigneeExpression')"
              @change="applyAssigneeExpression"
            >
              <el-option
                v-for="option in expressionCatalog.options('ASSIGNEE')"
                :key="option.configKey"
                :label="option.configName"
                :value="option.configKey"
              />
            </el-select>
          </el-form-item>
          <template
            v-for="parameter in expressionCatalog.parameters(form.assigneeConfigKey)"
            :key="parameter.key"
          >
            <el-form-item :label="parameter.name"
              ><el-select
                v-if="parameter.type === 'PROCESS_VARIABLE'"
                v-model="form.assigneeParameters[parameter.key]"
                class="full-width"
                filterable
                allow-create
                default-first-option
                :reserve-keyword="false"
                :placeholder="parameter.name"
                @change="applyAssigneeExpression"
                ><el-option
                  v-for="option in processVariableOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value" /></el-select
              ><el-input
                v-else
                v-model="form.assigneeParameters[parameter.key]"
                @change="applyAssigneeExpression"
            /></el-form-item>
          </template>
          <el-form-item :label="t('bpm.modeler.property.fields.candidateUsers')">
            <el-select
              v-model="form.candidateUsers"
              class="full-width"
              multiple
              filterable
              clearable
              collapse-tags
              collapse-tags-tooltip
              fit-input-width
              placement="bottom-start"
              :fallback-placements="['top-start', 'bottom-start']"
              :max-collapse-tags="1"
              :loading="candidateUsersLoading"
              :placeholder="t('bpm.modeler.property.placeholders.candidateUsers')"
              @change="updateCandidateUsers"
            >
              <el-option
                v-for="option in candidateUserOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('bpm.modeler.property.fields.candidateGroups')">
            <el-select
              v-model="form.candidateGroups"
              class="full-width"
              multiple
              filterable
              clearable
              collapse-tags
              collapse-tags-tooltip
              fit-input-width
              placement="bottom-start"
              :fallback-placements="['top-start', 'bottom-start']"
              :max-collapse-tags="1"
              :loading="candidateGroupsLoading"
              :placeholder="t('bpm.modeler.property.placeholders.candidateGroups')"
              @change="updateCandidateGroups"
            >
              <el-option
                v-for="option in candidateGroupOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item :label="t('bpm.modeler.property.fields.assignee')">
            <el-select
              v-model="form.collectionConfigKey"
              class="full-width"
              clearable
              filterable
              :placeholder="t('bpm.modeler.property.placeholders.approverExpression')"
              @change="applyCollectionConfig"
            >
              <el-option
                v-for="option in expressionCatalog.options('MULTI_INSTANCE_USERS')"
                :key="option.configKey"
                :label="option.configName"
                :value="option.configKey"
              />
            </el-select>
          </el-form-item>
          <template
            v-for="parameter in expressionCatalog.parameters(form.collectionConfigKey)"
            :key="parameter.key"
          >
            <el-form-item :label="parameter.name">
              <el-select
                v-if="parameter.type === 'PROCESS_VARIABLE'"
                v-model="form.collectionParameters[parameter.key]"
                class="full-width"
                filterable
                allow-create
                default-first-option
                :reserve-keyword="false"
                :placeholder="parameter.name"
                @change="applyCollectionConfig"
                ><el-option
                  v-for="option in processVariableOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value" /></el-select
              ><el-input
                v-else
                v-model="form.collectionParameters[parameter.key]"
                @change="applyCollectionConfig"
              />
            </el-form-item>
          </template>
        </template>

        <el-form-item :label="t('bpm.modeler.property.fields.formKey')">
          <el-input
            v-model="form.formKey"
            :placeholder="t('bpm.modeler.property.placeholders.formKey')"
            @change="update('flowable:formKey')"
          />
        </el-form-item>
      </div>

      <div v-if="isSequenceFlow" class="panel-section condition-section">
        <div class="section-heading-row">
          <div>
            <div class="section-title">{{ t('bpm.modeler.property.sections.condition') }}</div>
            <div class="section-caption">{{ t('bpm.modeler.property.help.condition') }}</div>
          </div>
          <span class="condition-badge"><Icon icon="lucide:git-branch" /></span>
        </div>
        <el-form-item :label="t('bpm.modeler.property.fields.conditionExpression')">
          <el-select
            v-model="form.conditionConfigKey"
            class="full-width"
            clearable
            filterable
            :placeholder="t('bpm.modeler.property.placeholders.conditionExpression')"
            @change="applyConditionConfig"
          >
            <el-option
              v-for="option in expressionCatalog.options('SEQUENCE_CONDITION')"
              :key="option.configKey"
              :label="option.configName"
              :value="option.configKey"
            />
          </el-select>
        </el-form-item>
        <template
          v-for="parameter in expressionCatalog.parameters(form.conditionConfigKey)"
          :key="parameter.key"
        >
          <el-form-item :label="parameter.name">
            <el-select
              v-if="parameter.type === 'PROCESS_VARIABLE'"
              v-model="form.conditionParameters[parameter.key]"
              class="full-width"
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
              :placeholder="parameter.name"
              @change="applyConditionConfig"
              ><el-option
                v-for="option in processVariableOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value" /></el-select
            ><el-input
              v-else
              v-model="form.conditionParameters[parameter.key]"
              @change="applyConditionConfig"
            />
          </el-form-item>
        </template>
      </div>

      <div v-if="isUserTask || isProcess || isSequenceFlow" class="panel-section listener-section">
        <div class="section-heading-row">
          <div>
            <div class="section-title">{{ t('bpm.modeler.property.sections.listeners') }}</div>
            <div class="section-caption">
              {{
                t(
                  isProcess
                    ? 'bpm.modeler.listener.processCaption'
                    : 'bpm.modeler.listener.caption',
                )
              }}
            </div>
          </div>
          <el-button size="small" text bg type="primary" @click="openListenerDialog()">
            <Icon icon="lucide:plus" />{{ t('common.add') }}
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
              <button
                class="danger"
                :title="t('bpm.modeler.listener.delete')"
                @click="removeListener(listener.id)"
              >
                <Icon icon="lucide:trash-2" />
              </button>
            </div>
          </div>
        </div>

        <button v-else type="button" class="listener-empty" @click="openListenerDialog()">
          <Icon icon="lucide:radio-tower" />
          <span
            ><strong>{{ t('bpm.modeler.listener.emptyTitle') }}</strong
            >{{ t('bpm.modeler.listener.emptyDescription') }}</span
          >
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

      <div class="panel-section metadata-section">
        <div class="section-title">{{ t('bpm.modeler.property.sections.technical') }}</div>
        <div class="metadata-row">
          <span>{{ t('bpm.modeler.property.fields.bpmnType') }}</span
          ><code>{{ element.type }}</code>
        </div>
      </div>
    </el-form>

    <el-dialog
      v-model="listenerDialogVisible"
      :title="
        t(editingListenerId ? 'bpm.modeler.listener.dialogEdit' : 'bpm.modeler.listener.dialogAdd')
      "
      width="560px"
      append-to-body
      destroy-on-close
    >
      <el-form
        ref="listenerFormRef"
        :model="listenerDraft"
        :rules="listenerRules"
        label-position="top"
      >
        <div class="listener-form-grid">
          <el-form-item :label="t('bpm.modeler.listener.type')" prop="listenerType">
            <el-radio-group v-model="listenerDraft.listenerType" @change="resetListenerEvent">
              <el-radio-button v-if="isUserTask" value="task">
                {{ t('bpm.modeler.listener.taskListener') }}
              </el-radio-button>
              <el-radio-button value="execution">{{
                t('bpm.modeler.listener.executionListener')
              }}</el-radio-button>
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

        <el-form-item
          :label="t('bpm.modeler.listener.implementationType')"
          prop="implementationType"
        >
          <el-select v-model="listenerDraft.implementationType" class="full-width">
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
          v-if="listenerDraft.implementationType === 'class'"
          :label="t('bpm.modeler.listener.implementation')"
          prop="implementation"
        >
          <el-input
            v-model="listenerDraft.implementation"
            :placeholder="implementationPlaceholder"
          />
        </el-form-item>
        <template v-else>
          <el-form-item
            :label="t('bpm.modeler.property.fields.expressionConfig')"
            prop="implementation"
          >
            <el-select
              v-model="listenerDraft.expressionConfigKey"
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
            v-for="parameter in expressionCatalog.parameters(listenerDraft.expressionConfigKey)"
            :key="parameter.key"
          >
            <el-form-item :label="parameter.name"
              ><el-select
                v-if="parameter.type === 'PROCESS_VARIABLE'"
                v-model="listenerDraft.expressionParameters![parameter.key]"
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
                :model-value="String(listenerDraft.expressionParameters?.[parameter.key] ?? '')"
                @update:model-value="setListenerParameter(parameter.key, $event)"
                @change="applyListenerConfig"
            /></el-form-item>
          </template>
          <el-form-item :label="t('bpm.modeler.property.fields.expressionPreview')"
            ><el-input v-model="listenerDraft.implementation" readonly
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
        <div v-if="listenerDraft.fields.length" class="field-editor-list">
          <div v-for="(field, index) in listenerDraft.fields" :key="index" class="field-editor-row">
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
            <button
              type="button"
              class="field-remove"
              @click="listenerDraft.fields.splice(index, 1)"
            >
              <Icon icon="lucide:x" />
            </button>
          </div>
        </div>
        <div v-else class="field-editor-empty">{{ t('bpm.modeler.listener.noFields') }}</div>
      </el-form>
      <template #footer>
        <el-button @click="listenerDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveListener">{{
          t('bpm.modeler.actions.saveListener')
        }}</el-button>
      </template>
    </el-dialog>
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

type ProcessVariable = {
  key: string
  name: string
}

const form = reactive({
  id: '',
  name: '',
  category: '',
  description: '',
  assignee: '',
  candidateUsers: [] as string[],
  candidateGroups: [] as string[],
  formKey: '',
  approvalMode: 'single' as ApprovalMode,
  collection: '${approverList}',
  elementVariable: 'approver',
  serviceClass: '',
  delegateExpression: '',
  condition: '',
  conditionConfigKey: '',
  conditionParameters: {} as Record<string, any>,
  collectionConfigKey: '',
  collectionParameters: {} as Record<string, any>,
  assigneeConfigKey: '',
  assigneeParameters: {} as Record<string, any>,
  serviceExpressionConfigKey: '',
  serviceExpressionParameters: {} as Record<string, any>,
})

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
const processVariables = ref<ProcessVariable[]>([])
const systemProcessVariables: ProcessVariable[] = [
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
const sequenceFlowEventOptions = [{ key: 'bpm.modeler.listener.events.take', value: 'take' }]
const currentEventOptions = computed(() =>
  isSequenceFlow.value
    ? sequenceFlowEventOptions
    : listenerDraft.listenerType === 'task'
      ? taskEventOptions
      : executionEventOptions,
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

watch(
  () => props.element,
  (element) => {
    const businessObject = element?.businessObject
    form.id = businessObject?.id ?? ''
    form.name = businessObject?.name ?? ''
    form.category = businessObject?.get?.('flowable:category') ?? ''
    form.description = businessObject?.documentation?.[0]?.text ?? ''
    const processObject = findProcessBusinessObject(businessObject)
    processVariables.value = parseJsonArray(processObject?.get?.('flowable:variables'))
    form.assignee = businessObject?.get?.('flowable:assignee') ?? ''
    form.assigneeConfigKey = businessObject?.get?.('flowable:assigneeExpressionConfigKey') ?? ''
    form.assigneeParameters = parseJsonObject(
      businessObject?.get?.('flowable:assigneeExpressionParameters'),
    )
    form.candidateUsers = parseCandidateValues(businessObject?.get?.('flowable:candidateUsers'))
    form.candidateGroups = parseCandidateValues(businessObject?.get?.('flowable:candidateGroups'))
    form.formKey = businessObject?.get?.('flowable:formKey') ?? ''
    const loopCharacteristics = businessObject?.loopCharacteristics
    form.approvalMode = readApprovalMode(businessObject)
    form.collection = loopCharacteristics?.get?.('flowable:collection') ?? '${approverList}'
    form.elementVariable = loopCharacteristics?.get?.('flowable:elementVariable') ?? 'approver'
    form.collectionConfigKey = loopCharacteristics?.get?.('flowable:expressionConfigKey') ?? ''
    form.collectionParameters = parseJsonObject(
      loopCharacteristics?.get?.('flowable:expressionParameters'),
    )
    form.serviceClass = businessObject?.get?.('flowable:class') ?? ''
    form.delegateExpression = businessObject?.get?.('flowable:delegateExpression') ?? ''
    form.serviceExpressionConfigKey = businessObject?.get?.('flowable:expressionConfigKey') ?? ''
    form.serviceExpressionParameters = parseJsonObject(
      businessObject?.get?.('flowable:expressionParameters'),
    )
    form.condition = businessObject?.conditionExpression?.body ?? ''
    form.conditionConfigKey = businessObject?.get?.('flowable:expressionConfigKey') ?? ''
    form.conditionParameters = parseJsonObject(
      businessObject?.get?.('flowable:expressionParameters'),
    )
    listeners.value = readListeners(businessObject)
  },
  { immediate: true },
)

function update(property: string) {
  const fieldMap: Record<string, keyof typeof form> = {
    id: 'id',
    name: 'name',
    'flowable:category': 'category',
    'flowable:formKey': 'formKey',
    'flowable:class': 'serviceClass',
    'flowable:delegateExpression': 'delegateExpression',
  }
  const value = form[fieldMap[property]]
  emit('update', {
    [property]: Array.isArray(value) ? value.join(',') || undefined : value || undefined,
  })
}

function parseCandidateValues(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function updateProcessDescription() {
  emit('update', { documentationText: form.description || undefined })
}

function updateCandidateUsers() {
  emit('update', {
    'flowable:candidateUsers': form.candidateUsers.join(',') || undefined,
    'flowable:candidateUsersExpressionConfigKey': undefined,
    'flowable:candidateUsersExpressionParameters': undefined,
  })
}

function updateCandidateGroups() {
  emit('update', {
    'flowable:candidateGroups': form.candidateGroups.join(',') || undefined,
    'flowable:candidateGroupsExpressionConfigKey': undefined,
    'flowable:candidateGroupsExpressionParameters': undefined,
  })
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
  if (mode !== 'single') form.elementVariable = 'approver'
  updateApprovalConfig()
}

function updateApprovalConfig() {
  emit('updateApproval', {
    mode: form.approvalMode,
    collection: form.collection,
    elementVariable: 'approver',
    expressionConfigKey: form.collectionConfigKey || undefined,
    expressionParameters: form.collectionParameters,
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
    'flowable:expressionConfigKey': form.conditionConfigKey || undefined,
    'flowable:expressionParameters': form.conditionConfigKey
      ? JSON.stringify(form.conditionParameters)
      : undefined,
  })
}

function createEmptyListener(
  listenerType: ListenerConfig['listenerType'] = 'task',
): ListenerConfig {
  return {
    id: `listener_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    listenerType,
    event: listenerType === 'task' ? 'create' : 'start',
    implementationType: 'class',
    implementation: '',
    expressionConfigKey: '',
    expressionParameters: {},
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
        expressionConfigKey: value.expressionConfigKey ?? '',
        expressionParameters: parseJsonObject(value.expressionParameters),
        fields: (value.fields ?? []).map((field: any) => ({
          name: field.name ?? '',
          valueType: field.expression !== undefined ? 'expression' : 'stringValue',
          value: field.expression ?? field.stringValue ?? '',
          expressionConfigKey: field.expressionConfigKey ?? '',
          expressionParameters: parseJsonObject(field.expressionParameters),
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
    : createEmptyListener(isProcess.value || isSequenceFlow.value ? 'execution' : 'task')
  if (isProcess.value || isSequenceFlow.value) {
    next.listenerType = 'execution'
    if (isSequenceFlow.value) next.event = 'take'
    else if (!['start', 'end'].includes(next.event)) next.event = 'start'
  }
  Object.assign(listenerDraft, next)
  editingListenerId.value = listener?.id ?? ''
  listenerDialogVisible.value = true
  nextTick(() => listenerFormRef.value?.clearValidate())
}

function addListenerField() {
  listenerDraft.fields.push({
    name: '',
    valueType: 'stringValue',
    value: '',
    expressionParameters: {},
  })
}

function parseJsonObject(value?: string): Record<string, any> {
  if (!value) return {}
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function parseJsonArray(value?: string): ProcessVariable[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function findProcessBusinessObject(businessObject: any) {
  let current = businessObject
  while (current && current.$type !== 'bpmn:Process') current = current.$parent
  return current
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

function applyListenerConfig() {
  const resolved = expressionCatalog.value.resolve(
    listenerDraft.expressionConfigKey,
    listenerDraft.expressionParameters ?? {},
  )
  listenerDraft.expressionParameters = resolved.parameters
  listenerDraft.implementation = resolved.expression
}

function setListenerParameter(key: string, value: string) {
  if (!listenerDraft.expressionParameters) listenerDraft.expressionParameters = {}
  listenerDraft.expressionParameters[key] = value
}

function applyFieldConfig(field: ListenerField) {
  const resolved = expressionCatalog.value.resolve(
    field.expressionConfigKey,
    field.expressionParameters ?? {},
  )
  field.expressionParameters = resolved.parameters
  field.value = resolved.expression
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

async function saveListener() {
  await listenerFormRef.value?.validate()
  if (isProcess.value || isSequenceFlow.value) listenerDraft.listenerType = 'execution'
  const nextListener: ListenerConfig = {
    ...listenerDraft,
    fields: listenerDraft.fields.map((field) => ({ ...field })),
  }
  const index = listeners.value.findIndex((listener) => listener.id === editingListenerId.value)
  if (index >= 0) listeners.value.splice(index, 1, nextListener)
  else listeners.value.push(nextListener)
  emit(
    'updateListeners',
    listeners.value.map((listener) => ({
      ...listener,
      fields: listener.fields.map((field) => ({ ...field })),
    })),
  )
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

onMounted(() => {
  void Promise.all([
    loadProcessCategories(),
    loadCandidateUsers(),
    loadCandidateGroups(),
    loadExpressionOptions(),
  ])
})
</script>

<style lang="scss" scoped>
.property-panel {
  height: 100%;
  overflow: auto;
  color: var(--theme-text-primary);
  background: #fff;
}

.panel-heading {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--p-space-5) var(--p-space-5) var(--p-space-4);
  border-bottom: 1px solid var(--theme-border-light);
  background: var(--theme-bg-surface);
  backdrop-filter: blur(8px);

  h2 {
    margin: 3px 0 0;
    font-size: var(--p-text-xl);
    letter-spacing: -0.02em;
  }
}

.eyebrow {
  color: var(--theme-accent-strong);
  font-size: var(--p-text-xs);
  font-weight: 700;
  letter-spacing: 0.16em;
}
.type-pill {
  padding: 5px 8px;
  color: var(--theme-accent-strong);
  font-size: var(--p-text-xs);
  font-weight: 600;
  border-radius: var(--p-radius-md);
  background: var(--theme-accent-light);
}

.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 28px 0;
  text-align: center;

  strong {
    margin-top: var(--p-space-4);
    font-size: var(--p-text-lg);
  }
  p {
    max-width: 220px;
    margin: var(--p-space-2) 0;
    color: var(--theme-text-muted);
    font-size: var(--p-text-sm);
    line-height: 1.7;
  }
}

.empty-icon {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  color: var(--theme-accent-strong);
  font-size: var(--p-text-2xl);
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-2xl);
  background: var(--theme-accent-light);
}

.property-form {
  padding-bottom: var(--p-space-6);
}
.panel-section {
  padding: var(--p-space-4-5) var(--p-space-5) var(--p-space-1);
  border-bottom: 1px solid var(--theme-border-light);
}
.section-title {
  margin-bottom: 15px;
  color: var(--theme-text-secondary);
  font-size: var(--p-text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.field-help {
  margin-top: 5px;
  color: var(--theme-text-muted);
  font-size: var(--p-text-xs);
  line-height: 1.5;
}
.field-help code {
  color: var(--theme-accent-strong);
  font-size: var(--p-text-xs);
}
.approval-mode-grid {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}
.approval-mode-card {
  display: flex;
  align-items: center;
  gap: var(--p-space-2);
  min-height: 52px;
  padding: 9px 10px;
  color: var(--theme-text-secondary);
  text-align: left;
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-lg);
  background: #fff;
  cursor: pointer;
  transition: var(--p-duration-normal) ease;
}
.approval-mode-card > svg {
  flex: 0 0 auto;
  font-size: var(--p-text-xl);
}
.approval-mode-card span {
  display: grid;
  color: var(--theme-text-muted);
  font-size: var(--p-text-xs);
  line-height: 1.35;
}
.approval-mode-card strong {
  color: var(--theme-text-primary);
  font-size: var(--p-text-xs);
}
.approval-mode-card:hover {
  border-color: var(--theme-accent);
  background: var(--theme-bg-elevated);
}
.approval-mode-card.active {
  color: var(--theme-accent-strong);
  border-color: var(--theme-accent);
  background: var(--theme-accent-light);
  box-shadow: 0 0 0 1px var(--theme-accent-glow);
}
.approval-mode-card.active strong {
  color: var(--theme-accent-strong);
}
.approval-runtime-note {
  display: flex;
  align-items: flex-start;
  gap: var(--p-space-2);
  margin: -4px 0 17px;
  padding: 9px 10px;
  color: var(--theme-text-secondary);
  font-size: var(--p-text-xs);
  line-height: 1.5;
  border-radius: var(--p-radius-lg);
  background: var(--theme-bg-elevated);
}
.approval-runtime-note > svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--theme-accent-strong);
}
.approval-runtime-note code {
  color: var(--theme-accent-strong);
  font-weight: 600;
}
.condition-section {
  padding-bottom: var(--p-space-2);
  background: linear-gradient(180deg, var(--theme-bg-surface) 0%, #fff 100%);
}
.condition-badge {
  display: grid;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  place-items: center;
  color: var(--theme-accent-strong);
  font-size: var(--p-text-md);
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-lg);
  background: var(--theme-accent-light);
}
.section-heading-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--p-space-3);
  margin-bottom: var(--p-space-3-5);
}
.section-heading-row .section-title {
  margin-bottom: 3px;
}
.section-caption {
  color: var(--theme-text-muted);
  font-size: var(--p-text-xs);
}
.listener-section {
  padding-bottom: var(--p-space-4-5);
}
.listener-list {
  display: grid;
  gap: var(--p-space-2);
}
.listener-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--p-space-2);
  padding: 11px;
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-lg);
  background: var(--theme-bg-surface);
  transition: var(--p-duration-normal) ease;
}
.listener-card:hover {
  border-color: var(--theme-accent);
  box-shadow: 0 5px 14px var(--theme-shadow-md);
}
.listener-card-main {
  display: flex;
  min-width: 0;
  gap: 9px;
}
.listener-kind {
  flex: 0 0 auto;
  height: 21px;
  padding: 3px 6px;
  color: var(--theme-accent-strong);
  font-size: var(--p-text-xs);
  font-weight: 700;
  border-radius: var(--p-radius-sm);
  background: var(--theme-accent-light);
}
.listener-kind.execution {
  color: var(--theme-warning);
  background: var(--theme-warning-light);
}
.listener-copy {
  min-width: 0;
}
.listener-event {
  color: var(--theme-text-primary);
  font-size: var(--p-text-sm);
  font-weight: 650;
}
.listener-implementation {
  max-width: 165px;
  margin-top: 3px;
  overflow: hidden;
  color: var(--theme-text-secondary);
  font-size: var(--p-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.listener-fields {
  margin-top: var(--p-space-1);
  color: var(--theme-accent-strong);
  font-size: var(--p-text-xs);
}
.listener-actions {
  display: flex;
  flex: 0 0 auto;
  gap: var(--p-space-0-5);
}
.listener-actions button,
.field-remove {
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  color: var(--theme-text-secondary);
  border: 0;
  border-radius: var(--p-radius-md);
  background: transparent;
  cursor: pointer;
}
.listener-actions button:hover {
  color: var(--theme-accent-strong);
  background: var(--theme-accent-light);
}
.listener-actions button.danger:hover,
.field-remove:hover {
  color: var(--theme-danger);
  background: var(--theme-danger-light);
}
.listener-empty {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--p-space-2-5);
  padding: 13px 11px;
  color: var(--theme-accent-strong);
  text-align: left;
  border: 1px dashed var(--theme-border);
  border-radius: var(--p-radius-lg);
  background: var(--theme-bg-elevated);
  cursor: pointer;
}
.listener-empty > svg:last-child {
  margin-left: auto;
}
.listener-empty span {
  display: grid;
  color: var(--theme-text-muted);
  font-size: var(--p-text-xs);
}
.listener-empty strong {
  margin-bottom: var(--p-space-0-5);
  color: var(--theme-text-primary);
  font-size: var(--p-text-xs);
}
.metadata-section {
  border-bottom: 0;
}
.metadata-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--p-space-2-5);
  padding-bottom: var(--p-space-3-5);
  color: var(--theme-text-secondary);
  font-size: var(--p-text-sm);
}
.metadata-row code {
  color: var(--theme-text-secondary);
  font-size: var(--p-text-xs);
  word-break: break-all;
}

:deep(.el-form-item) {
  align-items: flex-start;
  margin-bottom: var(--p-space-3);
}
:deep(.el-form-item__label) {
  min-height: 32px;
  padding-right: var(--p-space-1);
  color: var(--theme-text-secondary);
  font-size: var(--p-text-xs);
  font-weight: 600;
  line-height: 32px;
}
:deep(.el-form-item__content) {
  min-width: 0;
}
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  box-shadow: 0 0 0 1px var(--theme-border) inset;
}
:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--theme-accent) inset;
}
</style>

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
