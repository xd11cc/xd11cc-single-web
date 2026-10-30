<template>
  <div class="panel-section">
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
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useElementContext } from '../element-context'

/**
 * 服务任务：Java 类 / 委托表达式。
 *
 * 从 PropertyPanel 拆分而来：每个元素类型一个面板，主文件只负责分派。
 * 表单上下文（form / 写入函数 / 选项）通过 useElementContext 注入。
 */

defineOptions({ name: 'ServiceTaskPanel' })

const { t } = useI18n()

const { form, update } = useElementContext()
</script>
