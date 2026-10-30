<template>
  <div class="panel-section metadata-section">
    <div class="section-title">{{ t('bpm.modeler.property.sections.technical') }}</div>
    <div class="metadata-row">
      <span>{{ t('bpm.modeler.property.fields.bpmnType') }}</span
      ><code>{{ element.type }}</code>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useElementContext } from '../element-context'

/**
 * 只读的技术信息（BPMN 元素类型）。
 *
 * 从 PropertyPanel 拆分而来：每个元素类型一个面板，主文件只负责分派。
 * 表单上下文（form / 写入函数 / 选项）通过 useElementContext 注入。
 */

defineOptions({ name: 'MetadataSection' })

const { t } = useI18n()

const { element } = useElementContext()
</script>
