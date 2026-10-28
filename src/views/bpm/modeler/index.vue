<template>
  <div class="modeler-page">
    <header class="modeler-header">
      <div class="header-main">
        <button
          type="button"
          class="back-button"
          :title="t('common.back')"
          @click="returnToDefinition"
        >
          <Icon icon="lucide:arrow-left" />
          <span>{{ t('common.back') }}</span>
        </button>
        <span class="header-divider"></span>
        <div class="process-identity">
          <span class="process-icon"><Icon icon="lucide:file-cog" /></span>
          <div>
            <input
              v-model="processName"
              class="process-name"
              :aria-label="t('bpm.modeler.process.nameLabel')"
              @change="updateProcessMetadata"
            />
            <div class="process-key">{{ t('bpm.modeler.process.key', { key: processKey }) }}</div>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <div class="canvas-tools">
          <button :title="t('bpm.modeler.toolbar.undo')" @click="designerRef?.undo()">
            <Icon icon="lucide:undo-2" />
          </button>
          <button :title="t('bpm.modeler.toolbar.redo')" @click="designerRef?.redo()">
            <Icon icon="lucide:redo-2" />
          </button>
          <span class="tool-divider"></span>
          <button :title="t('bpm.modeler.toolbar.zoomOut')" @click="designerRef?.zoom(-0.1)">
            <Icon icon="lucide:zoom-out" />
          </button>
          <button :title="t('bpm.modeler.toolbar.fitViewport')" @click="designerRef?.fitViewport()">
            <Icon icon="lucide:scan" />
          </button>
          <button :title="t('bpm.modeler.toolbar.zoomIn')" @click="designerRef?.zoom(0.1)">
            <Icon icon="lucide:zoom-in" />
          </button>
        </div>
        <el-button @click="openXmlDialog"
          ><Icon icon="lucide:code-xml" />{{ t('bpm.modeler.actions.viewXml') }}</el-button
        >
        <el-button @click="triggerImport"
          ><Icon icon="lucide:upload" />{{ t('common.import') }}</el-button
        >
        <el-dropdown trigger="click" @command="handleExport">
          <el-button
            ><Icon icon="lucide:download" />{{ t('common.export')
            }}<Icon icon="lucide:chevron-down"
          /></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="xml">{{
                t('bpm.modeler.actions.exportXml')
              }}</el-dropdown-item>
              <el-dropdown-item command="svg">{{
                t('bpm.modeler.actions.exportSvg')
              }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          type="primary"
          plain
          class="save-button"
          :loading="saveLoading"
          @click="saveProcess"
        >
          <Icon v-if="!saveLoading" icon="lucide:save" />{{ t('common.save') }}
        </el-button>
        <el-button
          type="primary"
          class="publish-button"
          :loading="publishLoading"
          @click="publishProcess"
        >
          <Icon v-if="!publishLoading" icon="lucide:rocket" />{{ t('bpm.modeler.actions.publish') }}
        </el-button>
      </div>
    </header>

    <main class="workspace">
      <div class="canvas-column">
        <BpmnDesigner
          ref="designerRef"
          :xml="currentXml"
          @changed="handleDesignerChanged"
          @selected="handleElementSelected"
          @ready="designerReady = true"
        />
      </div>
      <PropertyPanel
        :element="selectedElement"
        @update="handlePropertyUpdate"
        @update-listeners="designerRef?.updateListeners($event)"
        @update-approval="designerRef?.updateApprovalConfig($event)"
      />
    </main>

    <input
      ref="fileInputRef"
      type="file"
      accept=".bpmn,.xml,text/xml"
      hidden
      @change="importFile"
    />

    <el-dialog
      v-model="xmlDialogVisible"
      :title="t('bpm.modeler.xmlDialog.title')"
      width="min(960px, 92vw)"
      destroy-on-close
    >
      <div class="xml-dialog-toolbar">
        <el-radio-group v-model="xmlDialogMode" size="small">
          <el-radio-button value="preview">
            <Icon icon="lucide:eye" />{{ t('bpm.modeler.xmlDialog.preview') }}
          </el-radio-button>
          <el-radio-button value="edit">
            <Icon icon="lucide:pencil" />{{ t('bpm.modeler.xmlDialog.edit') }}
          </el-radio-button>
        </el-radio-group>
        <span class="xml-language-badge">XML</span>
      </div>

      <CodeBlock
        v-if="xmlDialogMode === 'preview'"
        class="xml-code-preview"
        :code="xmlEditorValue"
        language="xml"
        max-height="62vh"
      />
      <el-input
        v-else
        v-model="xmlEditorValue"
        type="textarea"
        :rows="24"
        class="xml-editor"
        spellcheck="false"
      />
      <template #footer>
        <el-button @click="xmlDialogVisible = false">{{ t('common.close') }}</el-button>
        <template v-if="xmlDialogMode === 'edit'">
          <el-button @click="copyXml">{{ t('bpm.modeler.actions.copyXml') }}</el-button>
          <el-button type="primary" @click="applyXml">{{
            t('bpm.modeler.actions.applyXml')
          }}</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import BpmnDesigner from './components/BpmnDesigner.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import CodeBlock from '@/views/tool/generateCode/components/CodeBlock.vue'
import { createDefaultProcessKey, createDefaultProcessXml } from './default-process'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { deployWorkflowDraft, getWorkflowDraft, saveWorkflowDraft } from './apis'

defineOptions({ name: 'BpmModeler' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const processKey = ref(createDefaultProcessKey())
const defaultProcessXml = createDefaultProcessXml({
  processName: t('bpm.modeler.process.defaultName'),
  processId: processKey.value,
})

const designerRef = ref<InstanceType<typeof BpmnDesigner>>()
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')
const currentXml = ref(defaultProcessXml)
const xmlEditorValue = ref('')
const xmlDialogVisible = ref(false)
const xmlDialogMode = ref<'preview' | 'edit'>('preview')
const selectedElement = ref<any | null>(null)
const designerReady = ref(false)
const processName = ref(t('bpm.modeler.process.defaultName'))
const saveLoading = ref(false)
const publishLoading = ref(false)
const modelId = ref(typeof route.query.modelId === 'string' ? route.query.modelId : '')
const processCategory = ref('')
const processDescription = ref('')

function returnToDefinition() {
  const returnTo = route.query.returnTo
  const target =
    typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')
      ? returnTo
      : '/bpm/definition'
  router.push(target)
}

function updateProcessMetadata() {
  designerRef.value?.updateProcess({ name: processName.value, id: processKey.value })
}

function handleElementSelected(element: any | null) {
  selectedElement.value = element
  if (element?.type !== 'bpmn:Process') return
  processName.value = element.businessObject?.name || t('bpm.modeler.process.defaultName')
  processKey.value = element.businessObject?.id || 'process'
  processCategory.value = element.businessObject?.get?.('flowable:category') ?? ''
  processDescription.value = element.businessObject?.documentation?.[0]?.text ?? ''
}

function handlePropertyUpdate(properties: Record<string, unknown>) {
  designerRef.value?.updateSelectedElement(properties)
  if (selectedElement.value?.type !== 'bpmn:Process') return
  if (typeof properties.name === 'string') processName.value = properties.name
  if (typeof properties.id === 'string') processKey.value = properties.id
  if (typeof properties['flowable:category'] === 'string')
    processCategory.value = properties['flowable:category']
  if (typeof properties.documentationText === 'string')
    processDescription.value = properties.documentationText
}

function handleDesignerChanged(xml: string) {
  currentXml.value = xml
}

async function openXmlDialog() {
  xmlEditorValue.value = (await designerRef.value?.saveXml()) || currentXml.value
  xmlDialogMode.value = 'preview'
  xmlDialogVisible.value = true
}

async function applyXml() {
  try {
    await designerRef.value?.importXml(xmlEditorValue.value)
    currentXml.value = xmlEditorValue.value
    xmlDialogVisible.value = false
    ElMessage.success(t('bpm.modeler.messages.xmlApplied'))
  } catch (error) {
    console.error('Failed to parse BPMN XML', error)
    ElMessage.error(t('bpm.modeler.messages.xmlInvalid'))
  }
}

async function copyXml() {
  try {
    await navigator.clipboard.writeText(xmlEditorValue.value)
    ElMessage.success(t('bpm.modeler.messages.xmlCopied'))
  } catch (error) {
    console.error('Failed to copy BPMN XML', error)
    ElMessage.error(t('bpm.modeler.messages.copyFailed'))
  }
}

function triggerImport() {
  fileInputRef.value?.click()
}

async function importFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const xml = await file.text()
    await designerRef.value?.importXml(xml)
    currentXml.value = xml
    ElMessage.success(t('bpm.modeler.messages.importSuccess', { filename: file.name }))
  } catch (error) {
    console.error('Failed to import BPMN XML', error)
    ElMessage.error(t('bpm.modeler.messages.importFailed'))
  } finally {
    input.value = ''
  }
}

function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

async function handleExport(command: string) {
  if (command === 'svg') {
    const svg = await designerRef.value?.saveSvg()
    if (svg) download(svg, `${processKey.value}.svg`, 'image/svg+xml')
    return
  }
  const xml = await designerRef.value?.saveXml()
  if (xml) download(xml, `${processKey.value}.bpmn20.xml`, 'application/xml')
}

async function saveProcess(): Promise<boolean> {
  if (!designerReady.value || saveLoading.value) return false
  saveLoading.value = true
  try {
    const xml = await designerRef.value?.saveXml()
    if (!xml) return false
    currentXml.value = xml
    const { data } = await saveWorkflowDraft({
      modelId: modelId.value || undefined,
      name: processName.value,
      key: processKey.value,
      category: processCategory.value,
      description: processDescription.value,
      editorSource: xml,
    })
    if (!data?.id) return false
    modelId.value = data.id
    if (modelId.value) {
      const detail = await getWorkflowDraft(modelId.value)
      if (detail.data.editorSource) {
        currentXml.value = detail.data.editorSource
        await designerRef.value?.importXml(detail.data.editorSource)
      }
      await router.replace({ query: { ...route.query, modelId: modelId.value } })
    }
    ElMessage.success(t('common.messages.operationSuccess'))
    return true
  } finally {
    saveLoading.value = false
  }
}

async function publishProcess() {
  if (!designerReady.value || publishLoading.value) return
  publishLoading.value = true
  try {
    // 必须先确认草稿保存成功再部署：
    // 保存失败时 modelId 可能仍是上一次的旧值，直接部署会把“旧版本”发布出去，
    // 用户却看到“发布成功”，造成版本错乱。
    const saved = await saveProcess()
    if (!saved || !modelId.value) return
    await deployWorkflowDraft(modelId.value)
    ElMessage.success(t('common.messages.operationSuccess'))
    returnToDefinition()
  } finally {
    publishLoading.value = false
  }
}

async function loadDraft(id: string) {
  if (!id || !designerReady.value) return
  const { data } = await getWorkflowDraft(id)
  if (!data.editorSource || id !== modelId.value) return
  processName.value = data.name || processName.value
  processKey.value = data.key || processKey.value
  processCategory.value = data.category || ''
  processDescription.value = data.description || ''
  currentXml.value = data.editorSource
  await designerRef.value?.importXml(data.editorSource)
}

// bpmn-js 必须完成初始化后才能导入草稿；直接在父组件 onMounted 调用会形成竞态。
watch(
  [designerReady, () => route.query.modelId],
  ([ready, routeModelId]) => {
    const id = typeof routeModelId === 'string' ? routeModelId : ''
    modelId.value = id
    if (ready && id) void loadDraft(id)
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
// 编辑器样式统一由设计系统令牌驱动，避免与全局主题出现“两套绿色”和暗色割裂。
.modeler-page {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--theme-text-primary);
  background: var(--theme-bg-page);
}

.modeler-header {
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 60px;
  padding: 8px 18px;
  border-bottom: 1px solid var(--theme-border);
  background: var(--theme-bg-surface);
}

.header-main,
.header-actions,
.process-identity,
.canvas-tools {
  display: flex;
  align-items: center;
}
.header-actions {
  min-width: 0;
  gap: 8px;
}
.header-actions :deep(.el-button) {
  gap: 6px;
}
.publish-button {
  --el-button-bg-color: var(--theme-accent);
  --el-button-border-color: var(--theme-accent);
  --el-button-hover-bg-color: var(--theme-accent-hover);
  --el-button-hover-border-color: var(--theme-accent-hover);
}
.save-button {
  --el-button-text-color: var(--theme-accent-strong);
  --el-button-bg-color: var(--theme-accent-light);
  --el-button-border-color: var(--theme-accent-light);
  --el-button-hover-text-color: #fff;
  --el-button-hover-bg-color: var(--theme-accent);
  --el-button-hover-border-color: var(--theme-accent);
}

.header-main {
  min-width: 0;
  gap: 14px;
}
.back-button {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  color: var(--theme-text-secondary);
  font: inherit;
  font-size: var(--p-text-base);
  font-weight: var(--p-weight-semibold);
  border: 1px solid transparent;
  border-radius: var(--p-radius-lg);
  background: transparent;
  cursor: pointer;
  transition:
    color var(--p-duration-fast) ease,
    border-color var(--p-duration-fast) ease,
    background var(--p-duration-fast) ease;
}
.back-button:hover {
  color: var(--theme-accent-strong);
  border-color: var(--theme-border);
  background: var(--theme-accent-light);
}
.back-button:focus-visible {
  outline: 2px solid var(--theme-accent);
  outline-offset: 2px;
}
.header-divider {
  flex: none;
  width: 1px;
  height: 28px;
  background: var(--theme-border);
}
.process-identity {
  min-width: 0;
  gap: 9px;
}
.process-icon {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  color: var(--theme-accent-strong);
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-lg);
  background: var(--theme-accent-light);
}
.process-name {
  width: 210px;
  padding: 0;
  color: var(--theme-text-primary);
  font-family: var(--p-font-display);
  font-size: var(--p-text-md);
  font-weight: var(--p-weight-semibold);
  border: 0;
  outline: 0;
  background: transparent;
}
.process-key {
  margin-top: 2px;
  color: var(--theme-text-muted);
  font-size: var(--p-text-sm);
  font-weight: var(--p-weight-semibold);
  letter-spacing: 0.08em;
}
.canvas-tools {
  padding: 3px;
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-lg);
  background: var(--theme-bg-surface);
  box-shadow: var(--theme-shadow-sm);
}
.canvas-tools button {
  display: grid;
  width: 31px;
  height: 29px;
  place-items: center;
  color: var(--theme-text-secondary);
  font-size: var(--p-text-lg);
  border: 0;
  border-radius: var(--p-radius-md);
  background: transparent;
  cursor: pointer;
  transition: var(--p-duration-fast) ease;
}
.canvas-tools button:hover {
  color: var(--theme-accent-strong);
  background: var(--theme-accent-light);
}
.tool-divider {
  width: 1px;
  height: 17px;
  margin: 0 3px;
  background: var(--theme-border);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  min-height: 0;
}
.canvas-column {
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--theme-border);
}
.xml-dialog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.xml-dialog-toolbar :deep(.el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.xml-language-badge {
  padding: 4px 8px;
  color: var(--theme-accent-strong);
  font-family: var(--p-font-mono);
  font-size: var(--p-text-sm);
  font-weight: var(--p-weight-bold);
  letter-spacing: 0.1em;
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-md);
  background: var(--theme-accent-light);
}
.xml-code-preview {
  border-radius: var(--p-radius-lg);
}
.xml-editor :deep(textarea) {
  font-family: var(--p-font-mono);
  font-size: var(--p-text-sm);
  line-height: 1.6;
}

// 设计器专属密度阈值：这是全屏编辑器，1100px 以下属性面板要从 320 收到 280、
// 顶栏按钮要去掉文字。不能复用 mobile(991)——992~1100 区间保持文字会挤爆顶栏；
// 也不该并到 lg(1200)——那是 min-width 档位，语义相反。
$bp-modeler-compact: 1100px;

@media (max-width: $bp-modeler-compact) {
  .header-actions :deep(.el-button span) {
    display: none;
  }
  .process-name {
    width: 170px;
  }
  .workspace {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
}

@include sm {
  .modeler-header {
    min-height: 54px;
    padding: 7px 10px;
  }
  .header-main {
    gap: 8px;
  }
  .back-button {
    width: 32px;
    padding: 0;
    justify-content: center;
  }
  .back-button span,
  .header-divider {
    display: none;
  }
  .process-icon {
    display: none;
  }
  .process-name {
    width: 130px;
  }
  .canvas-tools button {
    width: 28px;
  }
  .workspace {
    grid-template-columns: 1fr;
  }
  .workspace :deep(.property-panel) {
    display: none;
  }
}
</style>
