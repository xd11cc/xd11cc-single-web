<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :formRules="formRules"
    :add-title="$t('system.config.dialogs.add')"
    :edit-title="$t('system.config.dialogs.edit')"
    dialog-width="min(600px, calc(100vw - 32px))"
  >
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="configName" :label="$t('system.config.search.configName')">
        <el-input
          v-model="searchData.configName"
          :placeholder="$t('system.config.formPlaceholder.configName')"
        />
      </el-form-item>
      <el-form-item prop="configKey" :label="$t('system.config.search.configKey')">
        <el-input
          v-model="searchData.configKey"
          :placeholder="$t('system.config.formPlaceholder.configKey')"
        />
      </el-form-item>
    </template>

    <!-- 工具栏按钮 -->
    <template #actions="{ handleAdd, handleBatchRemove }">
      <el-button type="primary" @click="handleAdd" v-permission="['system:config:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>
        {{ $t('system.config.actions.add') }}
      </el-button>
      <el-button type="danger" @click="handleBatchRemove" v-permission="['system:config:delete']">
        <template #icon><Icon icon="lucide:trash-2" /></template>
        {{ $t('common.batchDelete') }}
      </el-button>
    </template>

    <!-- 表格列 -->
    <template #table="{ handleEdit, handleRemove }">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="configName" :label="$t('system.config.columns.configName')" />
      <el-table-column prop="configKey" :label="$t('system.config.columns.configKey')" />
      <el-table-column prop="configValue" :label="$t('system.config.columns.configValue')" />
      <el-table-column prop="remark" :label="$t('system.config.columns.remark')" />
      <el-table-column
        prop="createTime"
        :label="$t('system.config.columns.createTime')"
        align="center"
        min-width="160"
      />
      <el-table-column fixed="right" :label="$t('common.action')" width="90" align="center">
        <template #default="scope">
          <el-tooltip :content="$t('system.config.actions.edit')" placement="top">
            <el-button
              type="warning"
              text
              bg
              size="small"
              @click="handleEdit(scope.row)"
              v-permission="['system:config:update']"
            >
              <Icon icon="lucide:pencil" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('system.config.actions.delete')" placement="top">
            <el-button
              type="danger"
              text
              bg
              size="small"
              @click="handleRemove(scope.row)"
              v-permission="['system:config:delete']"
            >
              <Icon icon="lucide:trash-2" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </template>

    <!-- 新增/修改表单字段 -->
    <template #form-fields="{ formData }">
      <el-col :span="24">
        <el-form-item prop="configName" :label="$t('system.config.search.configName')">
          <el-input
            v-model="formData.configName"
            :placeholder="$t('system.config.formPlaceholder.configName')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="configKey" :label="$t('system.config.search.configKey')">
          <el-input
            v-model="formData.configKey"
            :placeholder="$t('system.config.formPlaceholder.configKey')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="configValue" :label="$t('system.config.form.configValue')">
          <el-input
            v-model="formData.configValue"
            :placeholder="$t('system.config.formPlaceholder.configValue')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="remark" :label="$t('system.config.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.config.formPlaceholder.remark')"
            autosize
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-col>
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import type { FormRules } from 'element-plus'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { configPage, addConfig, modifyConfigById, removeConfigByIds } from './apis'
import type { SystemConfigQueryVO, SystemConfigVO } from './apis/type'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'Config',
})

const formRules: FormRules<SystemConfigVO> = {
  configName: [
    {
      required: true,
      trigger: 'blur',
      message: () => $t('system.config.formPlaceholder.configName'),
    },
  ],
  configKey: [
    {
      required: true,
      trigger: 'blur',
      message: () => $t('system.config.formPlaceholder.configKey'),
    },
  ],
  configValue: [
    {
      required: true,
      trigger: 'blur',
      message: () => $t('system.config.formPlaceholder.configValue'),
    },
  ],
}

const crud = useCrud<SystemConfigQueryVO, SystemConfigVO>({
  pageApi: (query) => configPage(query),
  addApi: (data) => addConfig(data),
  updateApi: (data) => modifyConfigById(data),
  removeApi: (ids) => removeConfigByIds(ids),
  removeConfirmText: (row) =>
    $t('system.config.messages.deleteConfirm', { configName: row?.configName }),
  batchRemoveConfirmText: (count) => $t('system.config.messages.batchDeleteConfirm', { count }),
})
</script>
