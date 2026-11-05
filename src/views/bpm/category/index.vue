<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :columns="columns"
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
            :label="item.label"
            :value="item.value!"
          />
        </el-select>
      </el-form-item>
    </template>

    <template #actions="{ handleAdd, handleBatchRemove }">
      <el-button type="primary" @click="handleAdd" v-permission="['workflow:category:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>
        {{ $t('common.add') }}
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchRemove"
        v-permission="['workflow:category:delete']"
      >
        <template #icon><Icon icon="lucide:trash-2" /></template>
        {{ $t('common.batchDelete') }}
      </el-button>
    </template>

    <!-- 固定列：不参与列设置 -->
    <template #table-prefix>
      <el-table-column type="selection" width="50" align="center" />
    </template>

    <template #cell-status="{ row }">
      <el-tag
        :type="getDictItem('system_status', row.status)?.listClass || 'info'"
        effect="plain"
        size="small"
        disable-transitions
      >
        {{ getDictItem('system_status', row.status)?.label || row.status || '-' }}
      </el-tag>
    </template>

    <!-- 操作列：固定在生成列之后 -->
    <template #table-append="{ handleEdit, handleRemove }">
      <el-table-column fixed="right" :label="$t('common.action')" width="120" align="center">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="handleEdit(row)"
            v-permission="['workflow:category:update']"
          >
            {{ $t('common.edit') }}
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleRemove(row)"
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
              :value="item.value"
              >{{ item.label }}</el-radio
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
import type { TableColumnDef } from '@@/composables/useTableColumns'

const { t } = useI18n()
const $t = t
const { getDictList, getDictItem } = useDict('system_status')

defineOptions({ name: 'Category' })

// 列定义：排序 / 显隐 / 列宽由列表壳统一管理
const columns = computed<TableColumnDef[]>(() => [
  {
    prop: 'categoryCode',
    label: t('bpm.category.columns.code'),
    minWidth: 180,
  },
  {
    prop: 'categoryName',
    label: t('bpm.category.columns.name'),
    minWidth: 180,
  },
  { prop: 'sort', label: t('bpm.category.columns.sort'), width: 100, align: 'right' },
  { prop: 'status', label: t('bpm.category.columns.status'), width: 100, align: 'center' },
  {
    prop: 'remark',
    label: t('bpm.category.columns.remark'),
    minWidth: 220,
  },
  {
    prop: 'createTime',
    label: t('bpm.category.columns.createTime'),
    minWidth: 170,
    align: 'center',
  },
])

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
