<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :formRules="formRules"
    :add-title="$t('system.dict.data.dialogs.addData')"
    :edit-title="$t('system.dict.data.dialogs.editData')"
    dialog-width="min(600px, calc(100vw - 32px))"
  >
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData, refresh }">
      <el-form-item prop="dictType" :label="$t('system.dict.data.search.dictType')">
        <el-select
          v-model="searchData.dictType"
          :placeholder="$t('system.dict.data.search.dictTypePlaceholder')"
          class="search-field-lg"
          @change="refresh"
        >
          <el-option
            v-for="item in dictTypeOptions"
            :key="item.id"
            :label="item.dictName"
            :value="item.dictType!"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="label" :label="$t('system.dict.data.search.label')">
        <el-input
          v-model="searchData.label"
          :placeholder="$t('system.dict.data.formPlaceholder.label')"
        />
      </el-form-item>
      <el-form-item prop="value" :label="$t('system.dict.data.search.value')">
        <el-input
          v-model="searchData.value"
          :placeholder="$t('system.dict.data.formPlaceholder.value')"
        />
      </el-form-item>
      <el-form-item prop="status" :label="$t('system.dict.data.search.status')">
        <el-select
          v-model="searchData.status"
          :placeholder="$t('system.dict.data.search.statusPlaceholder')"
          clearable
          class="search-field-lg"
          @change="refresh"
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

    <!-- 工具栏：左侧增删，右侧导出 -->
    <template #actions="{ handleAdd, handleBatchRemove }">
      <el-button type="primary" @click="handleAdd" v-permission="['system:dictData:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>
        {{ $t('system.dict.data.actions.addData') }}
      </el-button>
      <el-button type="danger" @click="handleBatchRemove" v-permission="['system:dictData:delete']">
        <template #icon><Icon icon="lucide:trash-2" /></template>
        {{ $t('common.batchDelete') }}
      </el-button>
    </template>
    <template #actions-right>
      <el-tooltip :content="$t('system.dict.data.actions.exportTitle')">
        <el-button type="primary" circle v-permission="['system:dictData:export']">
          <template #icon><Icon icon="lucide:download" /></template>
        </el-button>
      </el-tooltip>
    </template>

    <!-- 表格列 -->
    <template #table="{ handleEdit, handleRemove }">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="label" :label="$t('system.dict.data.columns.label')" />
      <el-table-column prop="value" :label="$t('system.dict.data.columns.value')" />
      <el-table-column prop="sort" :label="$t('system.dict.data.columns.sort')" align="right" />
      <el-table-column prop="status" :label="$t('system.dict.data.columns.status')" align="center">
        <template #default="scope">
          <el-tag
            :type="getDictItem('system_status', scope.row.status)?.listClass || 'info'"
            effect="plain"
            disable-transitions
          >
            {{ getDictItem('system_status', scope.row.status)?.value }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" :label="$t('system.dict.data.columns.remark')" />
      <el-table-column
        prop="createTime"
        :label="$t('system.dict.data.columns.createTime')"
        align="center"
        min-width="160"
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
              v-permission="['system:dictData:update']"
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
              v-permission="['system:dictData:delete']"
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
        <el-form-item prop="dictType" :label="$t('system.dict.data.form.dictType')">
          <el-input v-model="formData.dictType" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="label" :label="$t('system.dict.data.form.label')">
          <el-input
            v-model="formData.label"
            :placeholder="$t('system.dict.data.formPlaceholder.label')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="value" :label="$t('system.dict.data.form.value')">
          <el-input
            v-model="formData.value"
            :placeholder="$t('system.dict.data.formPlaceholder.value')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="cssClass" :label="$t('system.dict.data.form.cssClass')">
          <el-input
            v-model="formData.cssClass"
            :placeholder="$t('system.dict.data.formPlaceholder.cssClass')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="listClass" :label="$t('system.dict.data.form.listClass')">
          <el-select v-model="formData.listClass" class="search-field">
            <el-option
              v-for="item in listOption"
              :key="item.value"
              :label="item.label + '(' + item.value + ')'"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="sort" :label="$t('system.dict.data.form.sort')">
          <el-input-number v-model="formData.sort" :min="0" controls-position="right" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="status" :label="$t('system.dict.data.form.status')">
          <el-radio-group v-model="formData.status">
            <el-radio
              v-for="item in getDictList('system_status')"
              :key="item.id"
              :value="item.label"
            >
              {{ item.value }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="remark" :label="$t('system.dict.data.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.dict.data.formPlaceholder.remark')"
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
import { useDict } from '@/common/composables/useDict'
import type { SystemDictDataVO, SystemDictDataQueryVO, SystemDictTypeVO } from './apis/type'
import {
  addDictData,
  dictDataPage,
  modifyDictDataById,
  removeDictDataByIds,
  dictTypeList,
} from './apis'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'dictData',
})

const { getDictItem, getDictList } = useDict(['system_status'])

const route = useRoute()
const dictType = route.query.dictType as string | undefined

const dictTypeOptions = ref<SystemDictTypeVO[]>([])

const listOption = computed(() => [
  { value: 'primary', label: $t('system.dict.data.listClass.primary') },
  { value: 'success', label: $t('system.dict.data.listClass.success') },
  { value: 'info', label: $t('system.dict.data.listClass.info') },
  { value: 'warning', label: $t('system.dict.data.listClass.warning') },
  { value: 'danger', label: $t('system.dict.data.listClass.danger') },
])

const formRules: FormRules<SystemDictDataVO> = {
  label: [
    {
      required: true,
      trigger: 'blur',
      message: () => $t('system.dict.data.formPlaceholder.label'),
    },
  ],
  value: [
    {
      required: true,
      trigger: 'blur',
      message: () => $t('system.dict.data.formPlaceholder.value'),
    },
  ],
}

const crud = useCrud<SystemDictDataQueryVO, SystemDictDataVO>({
  pageApi: (query) => dictDataPage(query),
  addApi: (data) => addDictData(data),
  updateApi: (data) => modifyDictDataById(data),
  removeApi: (ids) => removeDictDataByIds(ids),
  // 从字典类型页跳转过来时带上 dictType，重置时也要恢复它
  defaultQuery: () => ({ dictType }) as SystemDictDataQueryVO,
  defaultForm: () => ({
    dictType,
    sort: 0,
    status: '0',
    listClass: 'primary',
  }),
  removeConfirmText: (row) => $t('system.dict.data.messages.deleteConfirm', { value: row?.value }),
  batchRemoveConfirmText: (count) => $t('system.dict.data.messages.batchDeleteConfirm', { count }),
})

function getDictTypeList() {
  dictTypeList()
    .then(({ data }) => {
      dictTypeOptions.value = data
    })
    .catch(() => {
      dictTypeOptions.value = []
    })
}

onMounted(() => {
  getDictTypeList()
})
</script>
