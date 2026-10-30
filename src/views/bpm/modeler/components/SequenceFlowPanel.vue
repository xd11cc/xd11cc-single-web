<template>
  <div class="panel-section condition-section">
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
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useElementContext } from '../element-context'

/**
 * 连线：条件表达式与表达式配置。
 *
 * 从 PropertyPanel 拆分而来：每个元素类型一个面板，主文件只负责分派。
 * 表单上下文（form / 写入函数 / 选项）通过 useElementContext 注入。
 */

defineOptions({ name: 'SequenceFlowPanel' })

const { t } = useI18n()

const {
  form,
  update,
  updateCondition,
  expressionCatalog,
  processVariableOptions,
  applyConditionConfig,
} = useElementContext()
</script>
