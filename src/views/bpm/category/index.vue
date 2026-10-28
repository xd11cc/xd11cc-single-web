<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :formRules="formRules"
    :add-title="$t('bpm.category.dialogs.add')"
    :edit-title="$t('bpm.category.dialogs.edit')"
  >
    <template #search-form="{ searchData }">
      <el-form-item prop="categoryCode" :label="$t('bpm.category.search.code')">
        <el-input
          v-model="searchData.categoryCode"
          clearable
          :placeholder="$t('bpm.category.placeholder.code')"
        />
      </el-form-item>
      <el-form-item prop="categoryName" :label="$t('bpm.category.search.name')">
        <el-input
          v-model="searchData.categoryName"
          clearable
          :placeholder="$t('bpm.category.placeholder.name')"
        />
      </el-form-item>
      <el-form-item prop="status" :label="$t('bpm.category.search.status')">
        <el-select
          v-model="searchData.status"
          clearable
          :placeholder="$t('bpm.category.placeholder.status')"
          class="search-field"
        >
          <el-option
            v-for="item in getDictList('system_status')"
            :key="item.id"
            :label="item.value"
            :value="item.label!"
          />
        </el-select>
      </el-form-item>
    </template>

    <template #actions>
      <el-button
        type="primary"
        @click="crud.methods.handleAdd"
        v-permission="['workflow:category:add']"
      >
        <template #icon><Icon icon="lucide:plus-circle" /></template>
        {{ $t('common.add') }}
      </el-button>
      <el-button
        type="danger"
        @click="crud.methods.handleBatchRemove"
        v-permission="['workflow:category:delete']"
      >
        <template #icon><Icon icon="lucide:trash-2" /></template>
        {{ $t('common.batchDelete') }}
      </el-button>
    </template>

    <template #table>
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column
        prop="categoryCode"
        :label="$t('bpm.category.columns.code')"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column
        prop="categoryName"
        :label="$t('bpm.category.columns.name')"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column
        prop="sort"
        :label="$t('bpm.category.columns.sort')"
        width="100"
        align="right"
      />
      <el-table-column
        prop="status"
        :label="$t('bpm.category.columns.status')"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <el-tag
            :type="getDictItem('system_status', row.status)?.listClass || 'info'"
            effect="plain"
            size="small"
            disable-transitions
          >
            {{ getDictItem('system_status', row.status)?.value || row.status || '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="remark"
        :label="$t('bpm.category.columns.remark')"
        min-width="220"
        show-overflow-tooltip
      />
      <el-table-column
        prop="createTime"
        :label="$t('bpm.category.columns.createTime')"
        min-width="170"
        align="center"
      />
      <el-table-column fixed="right" :label="$t('common.action')" width="120" align="center">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="crud.methods.handleEdit(row)"
            v-permission="['workflow:category:update']"
          >
            {{ $t('common.edit') }}
          </el-button>
          <el-button
            link
            type="danger"
            @click="crud.methods.handleRemove(row)"
            v-permission="['workflow:category:delete']"
          >
            {{ $t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </template>

    <template #form-fields="{ formData }">
      <el-col :span="12">
        <el-form-item prop="categoryCode" :label="$t('bpm.category.form.code')">
          <el-input
            v-model="formData.categoryCode"
            maxlength="64"
            show-word-limit
            :placeholder="$t('bpm.category.placeholder.code')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="categoryName" :label="$t('bpm.category.form.name')">
          <el-input
            v-model="formData.categoryName"
            maxlength="100"
            show-word-limit
            :placeholder="$t('bpm.category.placeholder.name')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="sort" :label="$t('bpm.category.form.sort')">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            :max="999999"
            controls-position="right"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="status" :label="$t('bpm.category.form.status')">
          <el-radio-group v-model="formData.status">
            <el-radio
              v-for="item in getDictList('system_status')"
              :key="item.id"
              :value="item.label"
              >{{ item.value }}</el-radio
            >
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="remark" :label="$t('bpm.category.form.remark')">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            :placeholder="$t('bpm.category.placeholder.remark')"
          />
        </el-form-item>
      </el-col>
    </template>
  </UseCrudView>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { useDict } from '@/common/composables/useDict'
import {
  addWorkflowCategory,
  modifyWorkflowCategory,
  removeWorkflowCategories,
  workflowCategoryPage,
} from './apis'
import type { WorkflowCategoryQueryVO, WorkflowCategoryVO } from './apis/type'

const { t } = useI18n()
const $t = t
const { getDictList, getDictItem } = useDict('system_status')

defineOptions({ name: 'bpmCategory' })

const crud = useCrud<WorkflowCategoryQueryVO, WorkflowCategoryVO>({
  pageApi: workflowCategoryPage,
  addApi: addWorkflowCategory,
  updateApi: modifyWorkflowCategory,
  removeApi: removeWorkflowCategories,
  defaultForm: () => ({ sort: 0, status: '0' }),
})

const formRules: FormRules = {
  categoryCode: [
    { required: true, trigger: 'blur', message: () => $t('bpm.category.validation.code') },
  ],
  categoryName: [
    { required: true, trigger: 'blur', message: () => $t('bpm.category.validation.name') },
  ],
  status: [
    { required: true, trigger: 'change', message: () => $t('bpm.category.validation.status') },
  ],
}
</script>
