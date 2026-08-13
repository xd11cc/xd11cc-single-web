<template>
  <div class="modeler-page">
    <header class="modeler-header">
      <div class="brand-block">
        <div class="brand-mark"><Icon icon="lucide:workflow" /></div>
        <div>
          <div class="brand-line">
            <h1>{{ t('bpm.modeler.title') }}</h1>
            <span class="standard-badge">{{ t('bpm.modeler.standard') }}</span>
          </div>
          <p>{{ t('bpm.modeler.subtitle') }}</p>
        </div>
      </div>

      <div class="header-actions">
        <div class="save-state" :class="{ saved: saveStatus === 'saved' }">
          <span class="state-dot"></span>{{ saveStatusText }}
        </div>
        <el-button @click="openXmlDialog"><Icon icon="lucide:code-xml" />{{ t('bpm.modeler.actions.viewXml') }}</el-button>
        <el-button @click="triggerImport"><Icon icon="lucide:upload" />{{ t('bpm.modeler.actions.import') }}</el-button>
        <el-dropdown trigger="click" @command="handleExport">
          <el-button><Icon icon="lucide:download" />{{ t('bpm.modeler.actions.export') }}<Icon icon="lucide:chevron-down" /></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="xml">{{ t('bpm.modeler.actions.exportXml') }}</el-dropdown-item>
              <el-dropdown-item command="svg">{{ t('bpm.modeler.actions.exportSvg') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" class="publish-button" @click="publishProcess">
          <Icon icon="lucide:rocket" />{{ t('bpm.modeler.actions.publish') }}
        </el-button>
      </div>
    </header>

    <div class="process-strip">
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
      <div class="canvas-tools">
        <button :title="t('bpm.modeler.toolbar.undo')" @click="designerRef?.undo()"><Icon icon="lucide:undo-2" /></button>
        <button :title="t('bpm.modeler.toolbar.redo')" @click="designerRef?.redo()"><Icon icon="lucide:redo-2" /></button>
        <span class="tool-divider"></span>
        <button :title="t('bpm.modeler.toolbar.zoomOut')" @click="designerRef?.zoom(-0.1)"><Icon icon="lucide:zoom-out" /></button>
        <button :title="t('bpm.modeler.toolbar.fitViewport')" @click="designerRef?.fitViewport()"><Icon icon="lucide:scan" /></button>
        <button :title="t('bpm.modeler.toolbar.zoomIn')" @click="designerRef?.zoom(0.1)"><Icon icon="lucide:zoom-in" /></button>
      </div>
    </div>

    <main class="workspace">
      <div class="canvas-column">
        <BpmnDesigner
          ref="designerRef"
          :xml="currentXml"
          @changed="handleDesignerChanged"
          @selected="selectedElement = $event"
          @ready="designerReady = true"
        />
      </div>
      <PropertyPanel
        :element="selectedElement"
        @update="designerRef?.updateSelectedElement($event)"
        @update-listeners="designerRef?.updateListeners($event)"
        @update-approval="designerRef?.updateApprovalConfig($event)"
      />
    </main>

    <input ref="fileInputRef" type="file" accept=".bpmn,.xml,text/xml" hidden @change="importFile" />

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
          <el-button type="primary" @click="applyXml">{{ t('bpm.modeler.actions.applyXml') }}</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import BpmnDesigner from './components/BpmnDesigner.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import CodeBlock from '@/views/tool/generateCode/components/CodeBlock.vue'
import { createDefaultProcessXml } from './default-process'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'BpmModeler' })

const { t } = useI18n()

const defaultProcessXml = createDefaultProcessXml({
  processName: t('bpm.modeler.process.defaultName'),
  startName: t('bpm.modeler.process.defaultNodes.start'),
  approvalName: t('bpm.modeler.process.defaultNodes.approval'),
  endName: t('bpm.modeler.process.defaultNodes.end'),
})

const STORAGE_KEY = 'xd11cc:bpm-modeler:draft'
const designerRef = ref<InstanceType<typeof BpmnDesigner>>()
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')
const currentXml = ref(localStorage.getItem(STORAGE_KEY) || defaultProcessXml)
const xmlEditorValue = ref('')
const xmlDialogVisible = ref(false)
const xmlDialogMode = ref<'preview' | 'edit'>('preview')
const selectedElement = ref<any | null>(null)
const designerReady = ref(false)
const processName = ref(t('bpm.modeler.process.defaultName'))
const processKey = ref('leaveApproval')
const saveStatus = ref<'saved' | 'saving'>('saved')
let saveTimer: ReturnType<typeof setTimeout> | undefined

const saveStatusText = computed(() =>
  t(`bpm.modeler.saveStatus.${saveStatus.value}`),
)

function markChanged() {
  saveStatus.value = 'saving'
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, currentXml.value)
    saveStatus.value = 'saved'
  }, 500)
}

function updateProcessMetadata() {
  designerRef.value?.updateProcess({ name: processName.value, id: processKey.value })
  markChanged()
}

function handleDesignerChanged(xml: string) {
  currentXml.value = xml
  markChanged()
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
    markChanged()
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
    markChanged()
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

async function publishProcess() {
  const xml = await designerRef.value?.saveXml()
  if (!xml || !designerReady.value) return
  await ElMessageBox.alert(
    t('bpm.modeler.messages.publishContent', {
      size: Math.ceil(new Blob([xml]).size / 1024),
    }),
    t('bpm.modeler.messages.publishTitle'),
    { confirmButtonText: t('bpm.modeler.messages.understood'), type: 'info' },
  )
}

onBeforeUnmount(() => window.clearTimeout(saveTimer))
</script>

<style lang="scss" scoped>
.modeler-page {
  --ink: #21313a;
  --muted: #71818a;
  --line: #e2e8eb;
  --accent: #087f5b;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--ink);
  background: #f5f7f8;
}

.modeler-header {
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 76px;
  padding: 12px 22px;
  border-bottom: 1px solid var(--line);
  background: #fff;
}

.brand-block, .brand-line, .header-actions, .process-identity, .canvas-tools { display: flex; align-items: center; }
.brand-block { gap: 13px; }
.brand-mark { display: grid; width: 42px; height: 42px; place-items: center; color: #fff; font-size: 21px; border-radius: 12px; background: #123f37; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12); }
.brand-line { gap: 9px; }
.brand-line h1 { margin: 0; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: -.02em; }
.brand-block p { margin: 3px 0 0; color: var(--muted); font-size: 12px; }
.standard-badge { padding: 3px 6px; color: #087f5b; font-size: 9px; font-weight: 700; letter-spacing: .08em; border: 1px solid #bfe1d5; border-radius: 5px; background: #ecf8f3; }
.header-actions { gap: 8px; }
.header-actions :deep(.el-button) { gap: 6px; }
.publish-button { --el-button-bg-color: #087f5b; --el-button-border-color: #087f5b; --el-button-hover-bg-color: #096e52; --el-button-hover-border-color: #096e52; }
.save-state { display: flex; align-items: center; gap: 7px; margin-right: 6px; color: #a17727; font-size: 11px; white-space: nowrap; }
.save-state.saved { color: #668078; }
.state-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.process-strip {
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 62px;
  padding: 8px 22px;
  border-bottom: 1px solid var(--line);
  background: #fbfcfc;
}
.process-identity { gap: 11px; }
.process-icon { display: grid; width: 34px; height: 34px; place-items: center; color: #0a7c5a; border: 1px solid #d5e9e2; border-radius: 9px; background: #edf8f4; }
.process-name { width: 260px; padding: 0; color: #2d3c44; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; border: 0; outline: 0; background: transparent; }
.process-key { margin-top: 2px; color: #92a0a7; font-size: 9px; font-weight: 600; letter-spacing: .08em; }
.canvas-tools { padding: 3px; border: 1px solid #dfe6e9; border-radius: 9px; background: #fff; box-shadow: 0 2px 5px rgba(29,48,59,.04); }
.canvas-tools button { display: grid; width: 31px; height: 29px; place-items: center; color: #61717a; font-size: 15px; border: 0; border-radius: 6px; background: transparent; cursor: pointer; transition: .16s ease; }
.canvas-tools button:hover { color: #087f5b; background: #edf8f4; }
.tool-divider { width: 1px; height: 17px; margin: 0 3px; background: #e2e8eb; }

.workspace { display: grid; grid-template-columns: minmax(0, 1fr) 310px; min-height: 0; }
.canvas-column { min-width: 0; min-height: 0; border-right: 1px solid var(--line); }
.xml-dialog-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.xml-dialog-toolbar :deep(.el-radio-button__inner) { display: inline-flex; align-items: center; gap: 6px; }
.xml-language-badge { padding: 4px 8px; color: #087f5b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; font-weight: 700; letter-spacing: .1em; border: 1px solid #c8e2d9; border-radius: 6px; background: #eff8f5; }
.xml-code-preview { border-radius: 9px; }
.xml-editor :deep(textarea) { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; line-height: 1.6; }

@media (max-width: 1100px) {
  .brand-block p, .save-state, .header-actions :deep(.el-button span) { display: none; }
  .workspace { grid-template-columns: minmax(0, 1fr) 280px; }
}

@media (max-width: 760px) {
  .modeler-header { min-height: 62px; padding: 10px 14px; }
  .brand-line h1 { font-size: 17px; }
  .standard-badge { display: none; }
  .process-strip { padding: 8px 12px; }
  .process-name { width: 170px; }
  .workspace { grid-template-columns: 1fr; }
  .workspace :deep(.property-panel) { display: none; }
}
</style>
