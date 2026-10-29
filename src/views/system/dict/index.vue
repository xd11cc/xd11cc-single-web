<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :formRules="formRules"
    :add-title="$t('system.dict.dialogs.add')"
    :edit-title="$t('system.dict.dialogs.edit')"
    dialog-width="min(600px, calc(100vw - 32px))"
  >
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="dictName" :label="$t('system.dict.search.dictName')">
        <el-input
          v-model="searchData.dictName"
          :placeholder="$t('system.dict.formPlaceholder.dictName')"
        />
      </el-form-item>
      <el-form-item prop="dictType" :label="$t('system.dict.search.dictType')">
        <el-input
          v-model="searchData.dictType"
          :placeholder="$t('system.dict.formPlaceholder.dictType')"
        />
      </el-form-item>
    </template>

    <!-- 工具栏：左侧增删，右侧导出 -->
    <template #actions="{ handleAdd, handleBatchRemove }">
      <el-button type="primary" @click="handleAdd" v-permission="['system:dictType:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>
        {{ $t('common.add') }}
      </el-button>
      <el-button type="danger" @click="handleBatchRemove" v-permission="['system:dictType:delete']">
        <template #icon><Icon icon="lucide:trash-2" /></template>
        {{ $t('common.batchDelete') }}
      </el-button>
    </template>
    <template #actions-right>
      <el-tooltip :content="$t('system.dict.actions.exportTitle')">
        <el-button type="primary" circle v-permission="['system:dictType:export']">
          <template #icon><Icon icon="lucide:download" /></template>
        </el-button>
      </el-tooltip>
    </template>

    <!-- 表格列 -->
    <template #table="{ handleEdit, handleRemove }">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="dictName" :label="$t('system.dict.search.dictName')" />
      <el-table-column prop="dictType" :label="$t('system.dict.search.dictType')" align="center">
        <template #default="scope">
          <router-link
            :to="{ path: '/system/dict-data', query: { dictType: scope.row.dictType } }"
            class="link-type"
          >
            <span>{{ scope.row.dictType }}</span>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column prop="remark" :label="$t('system.dict.columns.remark')" />
      <el-table-column
        prop="createTime"
        :label="$t('system.dict.columns.createTime')"
        align="center"
      />
      <el-table-column fixed="right" :label="$t('common.action')" width="90" align="center">
        <template #default="scope">
          <el-tooltip :content="$t('common.edit')" placement="top">
            <el-button
              type="warning"
              text
              bg
              size="small"
              @click="handleEdit(scope.row)"
              v-permission="['system:dictType:update']"
            >
              <Icon icon="lucide:pencil" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('common.delete')" placement="top">
            <el-button
              type="danger"
              text
              bg
              size="small"
              @click="handleRemove(scope.row)"
              v-permission="['system:dictType:delete']"
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
        <el-form-item prop="dictName" :label="$t('system.dict.search.dictName')">
          <el-input
            v-model="formData.dictName"
            :placeholder="$t('system.dict.formPlaceholder.dictName')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="dictType" :label="$t('system.dict.search.dictType')">
          <el-input
            v-model="formData.dictType"
            :placeholder="$t('system.dict.formPlaceholder.dictType')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="remark" :label="$t('system.dict.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.dict.formPlaceholder.remark')"
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
import { dictTypePage, addDictType, modifyDictTypeById, removeDictTypeByIds } from './apis/index'
import type { SystemDictTypeQueryVO, SystemDictTypeVO } from './apis/type'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'Dict',
})

const formRules: FormRules<SystemDictTypeVO> = {
  dictName: [
    { required: true, trigger: 'blur', message: () => $t('system.dict.formPlaceholder.dictName') },
  ],
  dictType: [
    { required: true, trigger: 'blur', message: () => $t('system.dict.formPlaceholder.dictType') },
  ],
}

const crud = useCrud<SystemDictTypeQueryVO, SystemDictTypeVO>({
  pageApi: (query) => dictTypePage(query),
  addApi: (data) => addDictType(data),
  updateApi: (data) => modifyDictTypeById(data),
  removeApi: (ids) => removeDictTypeByIds(ids),
  removeConfirmText: (row) => $t('system.dict.messages.deleteConfirm', { dictName: row?.dictName }),
  batchRemoveConfirmText: (count) => $t('system.dict.messages.batchDeleteConfirm', { count }),
})
</script>
