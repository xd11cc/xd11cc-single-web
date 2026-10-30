<template>
  <div class="panel-section listener-section">
    <div class="section-heading-row">
      <div>
        <div class="section-title">{{ t('bpm.modeler.property.sections.listeners') }}</div>
        <div class="section-caption">
          {{
            t(isProcess ? 'bpm.modeler.listener.processCaption' : 'bpm.modeler.listener.caption')
          }}
        </div>
      </div>
      <el-button size="small" text bg type="primary" @click="dialog?.open()">
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
          <button :title="t('bpm.modeler.listener.edit')" @click="dialog?.open(listener)">
            <Icon icon="lucide:pencil" />
          </button>
          <button
            class="danger"
            :title="t('bpm.modeler.listener.delete')"
            @click="emit('remove', listener.id)"
          >
            <Icon icon="lucide:trash-2" />
          </button>
        </div>
      </div>
    </div>

    <button v-else type="button" class="listener-empty" @click="dialog?.open()">
      <Icon icon="lucide:radio-tower" />
      <span
        ><strong>{{ t('bpm.modeler.listener.emptyTitle') }}</strong
        >{{ t('bpm.modeler.listener.emptyDescription') }}</span
      >
      <Icon icon="lucide:arrow-right" />
    </button>

    <ListenerDialog
      ref="dialog"
      :allow-task-listener="allowTaskListener"
      :is-sequence-flow="isSequenceFlow"
      :expression-options="expressionOptions"
      :process-variable-options="processVariableOptions"
      @save="(listener) => emit('save', listener)"
    />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import ListenerDialog from './ListenerDialog.vue'
import type { ListenerConfig } from '../types'
import type { WorkflowExpressionConfigVO } from '../../expression-config/apis/type'

/**
 * 执行/任务监听器的列表区块。
 *
 * 三种元素类型（用户任务 / 流程 / 连线）共用同一套列表与弹窗，
 * 拆出来后 PropertyPanel 只负责「要不要显示这个区块」。
 * 保存与删除的具体落地（写回 BPMN）仍由父组件处理，这里只发事件。
 */

defineOptions({ name: 'ListenerSection' })

defineProps<{
  listeners: ListenerConfig[]
  isProcess?: boolean
  allowTaskListener?: boolean
  isSequenceFlow?: boolean
  expressionOptions?: WorkflowExpressionConfigVO[]
  processVariableOptions?: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  save: [listener: ListenerConfig]
  remove: [id: string]
}>()

const { t } = useI18n()

const dialog = useTemplateRef<InstanceType<typeof ListenerDialog>>('dialog')

const implementationTypeLabel: Record<ListenerConfig['implementationType'], string> = {
  class: 'bpm.modeler.listener.implementationTypes.class',
  expression: 'bpm.modeler.listener.implementationTypes.expression',
  delegateExpression: 'bpm.modeler.listener.implementationTypes.delegateExpression',
}

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

function listenerEventLabel(listener: ListenerConfig) {
  const options = listener.listenerType === 'task' ? taskEventOptions : executionEventOptions
  const key = options.find((option) => option.value === listener.event)?.key
  return key ? t(key) : listener.event
}
</script>
