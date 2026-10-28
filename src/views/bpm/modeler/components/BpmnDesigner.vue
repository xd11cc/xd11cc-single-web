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
import type { ApprovalConfig, ListenerConfig } from '../types'

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
// 显式取浏览器 window.setTimeout 的返回类型，避免 NodeJS.Timeout 类型污染。
let exportTimer: number | undefined
let layoutObserver: ResizeObserver | undefined

async function fitViewportWhenReady() {
  const canvas = modeler?.get<any>('canvas')
  const element = canvasRef.value
  if (!canvas || !element) return

  // 路由切换时组件可能已经 mounted，但外层 transition/flex 尚未完成布局。
  // bpmn-js 在 0 尺寸容器上 fit viewport 会得到空白视图，因此至少等待两帧，
  // 并在尺寸有效后再执行 resize + fit。
  await nextTick()
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
  if (element.clientWidth > 0 && element.clientHeight > 0) {
    canvas.resized?.()
    canvas.zoom('fit-viewport', 'auto')
  }
}

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
    await fitViewportWhenReady()
    const canvas = modeler.get<any>('canvas')
    emit('selected', canvas.getRootElement())
  } finally {
    loading.value = false
  }
}

function getService<T = any>(name: string): T | null {
  return modeler?.get<T>(name) ?? null
}

function getActiveElement() {
  return (
    getService<any>('selection')?.get()?.[0] ?? getService<any>('canvas')?.getRootElement() ?? null
  )
}

function updateSelectedElement(properties: Record<string, unknown>) {
  const modeling = getService<any>('modeling')
  const moddle = getService<any>('moddle')
  const element = getActiveElement()
  if (element && modeling && moddle) {
    const nextProperties = { ...properties }
    const condition = nextProperties.conditionExpression as any
    if (condition?.$type === 'bpmn:FormalExpression') {
      nextProperties.conditionExpression = moddle.create('bpmn:FormalExpression', {
        body: condition.body,
      })
    }
    if ('documentationText' in nextProperties) {
      const documentationText = nextProperties.documentationText as string | undefined
      delete nextProperties.documentationText
      nextProperties.documentation = documentationText
        ? [moddle.create('bpmn:Documentation', { text: documentationText })]
        : []
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

function updateApprovalConfig(config: ApprovalConfig) {
  const selection = getService<any>('selection')
  const modeling = getService<any>('modeling')
  const moddle = getService<any>('moddle')
  const element = selection?.get()?.[0]
  if (!element || !modeling || !moddle) return
  const previousMode =
    element.businessObject?.get?.('flowable:approvalMode') ??
    (element.businessObject?.loopCharacteristics ? 'multi' : 'single')

  if (config.mode === 'single') {
    modeling.updateProperties(element, {
      loopCharacteristics: undefined,
      'flowable:approvalMode': config.mode,
      'flowable:assignee':
        previousMode === 'single' ? element.businessObject?.get?.('flowable:assignee') : undefined,
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
    'flowable:expressionConfigKey': config.expressionConfigKey,
    'flowable:expressionParameters': config.expressionParameters
      ? JSON.stringify(config.expressionParameters)
      : undefined,
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
  const modeling = getService<any>('modeling')
  const moddle = getService<any>('moddle')
  const element = getActiveElement()
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
          expressionConfigKey: field.expressionConfigKey,
          expressionParameters: field.expressionParameters
            ? JSON.stringify(field.expressionParameters)
            : undefined,
        }),
      )
    return moddle.create(
      listener.listenerType === 'task' ? 'flowable:TaskListener' : 'flowable:ExecutionListener',
      {
        event: listener.event,
        [listener.implementationType]: listener.implementation,
        fields,
        expressionConfigKey: listener.expressionConfigKey,
        expressionParameters: listener.expressionParameters
          ? JSON.stringify(listener.expressionParameters)
          : undefined,
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

onMounted(async () => {
  modeler = new Modeler({
    container: canvasRef.value!,
    moddleExtensions: { flowable: flowableModdle },
  })

  layoutObserver = new ResizeObserver(() => {
    void fitViewportWhenReady()
  })
  layoutObserver.observe(canvasRef.value!)

  const eventBus = modeler.get<any>('eventBus')
  eventBus.on('selection.changed', ({ newSelection }: any) => {
    const selectedElement = newSelection?.[0]
    if (selectedElement) {
      emit('selected', selectedElement)
      return
    }
    emit('selected', modeler?.get<any>('canvas')?.getRootElement() ?? null)
  })
  eventBus.on('element.changed', ({ element }: any) => {
    const selection = modeler?.get<any>('selection')?.get()?.[0]
    const activeElement = selection ?? modeler?.get<any>('canvas')?.getRootElement()
    if (activeElement?.id === element?.id) emit('selected', element)
  })
  eventBus.on('commandStack.changed', () => {
    window.clearTimeout(exportTimer)
    exportTimer = window.setTimeout(exportXml, 220)
  })

  await importXml(props.xml)
  await fitViewportWhenReady()
  emit('ready')
})

onBeforeUnmount(() => {
  window.clearTimeout(exportTimer)
  layoutObserver?.disconnect()
  layoutObserver = undefined
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
})
</script>

<style lang="scss">
@import 'bpmn-js/dist/assets/diagram-js.css';
@import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

// 画布背景与网格跟随设计系统主题，暗色下不出现刺眼的白底
.designer-shell {
  --canvas-grid-color: color-mix(in srgb, var(--theme-border) 60%, transparent);

  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--theme-bg-page);
  background-image:
    linear-gradient(var(--canvas-grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--canvas-grid-color) 1px, transparent 1px);
  background-size: 24px 24px;
}

.bpmn-canvas {
  width: 100%;
  height: 100%;
}

.bpmn-canvas .djs-container,
.bpmn-canvas .djs-container svg {
  font-family: var(--p-font-body);
}

.bpmn-canvas .djs-palette {
  top: 22px;
  left: 22px;
  overflow: hidden;
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-xl);
  background: var(--theme-bg-surface);
  box-shadow: var(--theme-shadow-lg);
}

.bpmn-canvas .djs-palette .entry:hover {
  color: var(--theme-accent-strong);
}

.bpmn-canvas .djs-context-pad {
  border-radius: 10px;
  filter: drop-shadow(0 8px 14px var(--theme-shadow-lg));
}

.bpmn-canvas .djs-element.selected .djs-outline {
  stroke: var(--theme-accent) !important;
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
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-bg-page) 86%, transparent);
  backdrop-filter: blur(4px);
}

.state-spinner {
  width: 26px;
  height: 26px;
  color: var(--theme-accent-strong);
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
  color: var(--theme-text-muted);
  font-size: var(--p-text-sm);
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-full);
  background: color-mix(in srgb, var(--theme-bg-surface) 86%, transparent);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

@keyframes state-spin {
  to {
    transform: rotate(360deg);
  }
}

@include mobile {
  .canvas-hint {
    display: none;
  }
}
</style>
