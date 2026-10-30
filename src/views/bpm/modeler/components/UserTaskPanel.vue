<template>
  <div class="panel-section">
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
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useElementContext } from '../element-context'

/**
 * 用户任务：审批模式、候选人/组、表单键。
 *
 * 从 PropertyPanel 拆分而来：每个元素类型一个面板，主文件只负责分派。
 * 表单上下文（form / 写入函数 / 选项）通过 useElementContext 注入。
 */

defineOptions({ name: 'UserTaskPanel' })

const { t } = useI18n()

const {
  form,
  update,
  approvalModeOptions,
  changeApprovalMode,
  candidateUserOptions,
  candidateGroupOptions,
  candidateUsersLoading,
  candidateGroupsLoading,
  loadCandidateUsers,
  loadCandidateGroups,
  updateCandidateUsers,
  updateCandidateGroups,
  expressionCatalog,
  processVariableOptions,
  applyCollectionConfig,
  applyAssigneeExpression,
  updateApprovalConfig,
} = useElementContext()
</script>
