<template>
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
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useElementContext } from '../element-context'

/**
 * 基础信息（流程键/名称/分类/描述，或节点名称/ID）。
 *
 * 从 PropertyPanel 拆分而来：每个元素类型一个面板，主文件只负责分派。
 * 表单上下文（form / 写入函数 / 选项）通过 useElementContext 注入。
 */

defineOptions({ name: 'BasicSection' })

const { t } = useI18n()

const { form, update, updateProcessDescription, processCategoryOptions, isProcess } =
  useElementContext()
</script>
