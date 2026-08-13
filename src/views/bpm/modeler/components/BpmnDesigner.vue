<template>
  <section class="designer-shell">
    <div ref="canvasRef" class="bpmn-canvas"></div>

    <div v-if="loading" class="canvas-state">
      <Icon icon="lucide:loader-circle" class="state-spinner" />
      <span>{{ t('bpm.modeler.canvas.loading') }}</span>
    </div>

    <div class="canvas-hint">
      <Icon icon="lucide:mouse-pointer-2" />
      {{ t('bpm.modeler.canvas.hint') }}
    </div>
  </section>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import Modeler from 'bpmn-js/lib/Modeler'
import flowableModdle from '../moddle/flowable.json'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  xml: string
}>()

const emit = defineEmits<{
  changed: [xml: string]
  selected: [element: any | null]
  ready: []
}>()

const canvasRef = useTemplateRef('canvasRef')
const loading = ref(true)
let modeler: Modeler<any> | null = null
let exportTimer: ReturnType<typeof setTimeout> | undefined

async function exportXml() {
  if (!modeler) return
  const { xml } = await modeler.saveXML({ format: true })
  if (xml) emit('changed', xml)
}

async function importXml(xml: string) {
  if (!modeler) return
  loading.value = true
  try {
    await modeler.importXML(xml)
    const canvas = modeler.get<any>('canvas')
    canvas.zoom('fit-viewport', 'auto')
    emit('selected', null)
  } finally {
    loading.value = false
  }
}

function getService<T = any>(name: string): T | null {
  return modeler?.get<T>(name) ?? null
}

function updateSelectedElement(properties: Record<string, unknown>) {
  const selection = getService<any>('selection')
  const modeling = getService<any>('modeling')
  const element = selection?.get()?.[0]
  if (element && modeling) {
    const nextProperties = { ...properties }
    const condition = nextProperties.conditionExpression as any
    if (condition?.$type === 'bpmn:FormalExpression') {
      const moddle = getService<any>('moddle')
      nextProperties.conditionExpression = moddle.create('bpmn:FormalExpression', {
        body: condition.body,
      })
    }
    modeling.updateProperties(element, nextProperties)
  }
}

function updateProcess(properties: Record<string, unknown>) {
  const canvas = getService<any>('canvas')
  const modeling = getService<any>('modeling')
  const rootElement = canvas?.getRootElement()
  if (rootElement && modeling) modeling.updateProperties(rootElement, properties)
}

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

type ApprovalConfig = {
  mode: 'single' | 'countersign' | 'orsign'
  collection: string
  elementVariable: string
}

function updateApprovalConfig(config: ApprovalConfig) {
  const selection = getService<any>('selection')
  const modeling = getService<any>('modeling')
  const moddle = getService<any>('moddle')
  const element = selection?.get()?.[0]
  if (!element || !modeling || !moddle) return
  const previousMode = element.businessObject?.get?.('flowable:approvalMode') ??
    (element.businessObject?.loopCharacteristics ? 'multi' : 'single')

  if (config.mode === 'single') {
    modeling.updateProperties(element, {
      loopCharacteristics: undefined,
      'flowable:approvalMode': config.mode,
      'flowable:assignee':
        previousMode === 'single'
          ? element.businessObject?.get?.('flowable:assignee')
          : undefined,
      ...(previousMode !== 'single'
        ? {
            'flowable:candidateUsers': undefined,
            'flowable:candidateGroups': undefined,
          }
        : {}),
    })
    return
  }

  const completionConditionBody =
    config.mode === 'orsign'
      ? '${nrOfCompletedInstances > 0}'
      : '${nrOfCompletedInstances == nrOfInstances}'
  const completionCondition = moddle.create('bpmn:FormalExpression', {
    body: completionConditionBody,
  })
  const loopCharacteristics = moddle.create('bpmn:MultiInstanceLoopCharacteristics', {
    isSequential: false,
    'flowable:collection': config.collection,
    'flowable:elementVariable': config.elementVariable,
    completionCondition,
  })
  modeling.updateProperties(element, {
    loopCharacteristics,
    'flowable:approvalMode': config.mode,
    'flowable:assignee': `\${${config.elementVariable}}`,
    'flowable:candidateUsers': undefined,
    'flowable:candidateGroups': undefined,
  })
}

function updateListeners(listeners: ListenerConfig[]) {
  const selection = getService<any>('selection')
  const modeling = getService<any>('modeling')
  const moddle = getService<any>('moddle')
  const element = selection?.get()?.[0]
  const businessObject = element?.businessObject
  if (!element || !businessObject || !modeling || !moddle) return

  const currentExtensionElements = businessObject.extensionElements
  const retainedValues = (currentExtensionElements?.values ?? []).filter(
    (value: any) =>
      value.$type !== 'flowable:TaskListener' && value.$type !== 'flowable:ExecutionListener',
  )

  const listenerValues = listeners.map((listener) => {
    const fields = listener.fields
      .filter((field) => field.name && field.value)
      .map((field) =>
        moddle.create('flowable:Field', {
          name: field.name,
          [field.valueType]: field.value,
        }),
      )
    return moddle.create(
      listener.listenerType === 'task'
        ? 'flowable:TaskListener'
        : 'flowable:ExecutionListener',
      {
        event: listener.event,
        [listener.implementationType]: listener.implementation,
        fields,
      },
    )
  })

  const values = [...retainedValues, ...listenerValues]
  const extensionElements = values.length
    ? moddle.create('bpmn:ExtensionElements', { values })
    : undefined
  modeling.updateProperties(element, { extensionElements })
}

async function saveXml() {
  if (!modeler) return ''
  return (await modeler.saveXML({ format: true })).xml ?? ''
}

async function saveSvg() {
  if (!modeler) return ''
  return (await modeler.saveSVG()).svg ?? ''
}

function zoom(step: number) {
  const canvas = getService<any>('canvas')
  if (!canvas) return
  const current = canvas.zoom()
  canvas.zoom(Math.min(4, Math.max(0.2, current + step)))
}

function fitViewport() {
  getService<any>('canvas')?.zoom('fit-viewport', 'auto')
}

function undo() {
  getService<any>('commandStack')?.undo()
}

function redo() {
  getService<any>('commandStack')?.redo()
}

function canUndo() {
  return Boolean(getService<any>('commandStack')?.canUndo())
}

function canRedo() {
  return Boolean(getService<any>('commandStack')?.canRedo())
}

onMounted(async () => {
  modeler = new Modeler({
    container: canvasRef.value!,
    moddleExtensions: { flowable: flowableModdle },
    keyboard: { bindTo: document },
  })

  const eventBus = modeler.get<any>('eventBus')
  eventBus.on('selection.changed', ({ newSelection }: any) => {
    emit('selected', newSelection?.[0] ?? null)
  })
  eventBus.on('element.changed', ({ element }: any) => {
    const selection = modeler?.get<any>('selection')?.get()?.[0]
    if (selection?.id === element?.id) emit('selected', element)
  })
  eventBus.on('commandStack.changed', () => {
    window.clearTimeout(exportTimer)
    exportTimer = window.setTimeout(exportXml, 220)
  })

  await importXml(props.xml)
  emit('ready')
})

onBeforeUnmount(() => {
  window.clearTimeout(exportTimer)
  modeler?.destroy()
  modeler = null
})

defineExpose({
  importXml,
  saveXml,
  saveSvg,
  updateSelectedElement,
  updateProcess,
  updateListeners,
  updateApprovalConfig,
  zoom,
  fitViewport,
  undo,
  redo,
  canUndo,
  canRedo,
})
</script>

<style lang="scss">
@import 'bpmn-js/dist/assets/diagram-js.css';
@import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

.designer-shell {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #f8fafc;
  background-image:
    linear-gradient(rgba(40, 58, 74, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(40, 58, 74, 0.035) 1px, transparent 1px);
  background-size: 24px 24px;
}

.bpmn-canvas {
  width: 100%;
  height: 100%;
}

.bpmn-canvas .djs-container,
.bpmn-canvas .djs-container svg {
  font-family: 'DM Sans', sans-serif;
}

.bpmn-canvas .djs-palette {
  top: 22px;
  left: 22px;
  overflow: hidden;
  border: 1px solid #dce4e9;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 34px rgba(32, 53, 66, 0.12);
}

.bpmn-canvas .djs-palette .entry:hover {
  color: #087f5b;
}

.bpmn-canvas .djs-context-pad {
  border-radius: 10px;
  filter: drop-shadow(0 8px 14px rgba(32, 53, 66, 0.12));
}

.bpmn-canvas .djs-element.selected .djs-outline {
  stroke: #0b8f68 !important;
  stroke-width: 2px !important;
}

.canvas-state {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  color: #52636d;
  background: rgba(248, 250, 252, 0.86);
  backdrop-filter: blur(4px);
}

.state-spinner {
  width: 26px;
  height: 26px;
  color: #087f5b;
  animation: state-spin 0.9s linear infinite;
}

.canvas-hint {
  position: absolute;
  right: 20px;
  bottom: 18px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  color: #6b7b84;
  font-size: 12px;
  border: 1px solid rgba(214, 224, 230, 0.9);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

@keyframes state-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .canvas-hint { display: none; }
}
</style>
