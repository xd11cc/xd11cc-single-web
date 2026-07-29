<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="menuName" :label="$t('system.menu.search.menuName')">
          <el-input
            v-model="searchData.menuName"
            :placeholder="$t('system.menu.formPlaceholder.menuName')"
          />
        </el-form-item>
        <el-form-item prop="status" :label="$t('system.menu.search.status')">
          <el-select
            v-model="searchData.status"
            :placeholder="$t('system.menu.formPlaceholder.status')"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="item in getDictList('system_status')"
              :key="item.id"
              :label="item.value"
              :value="item.label!"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template
            >{{ $t('common.search') }}</el-button
          >
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template
            >{{ $t('common.reset') }}</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" @click="handleAdd" v-permission="['system:menu:add']">
            <template #icon><Icon icon="lucide:plus-circle" /></template
            >{{ $t('system.menu.actions.add') }}</el-button
          >
          <el-button @click="toggleExpand">
            <template #icon><Icon icon="lucide:arrow-up-down" /></template
            >{{
              isExpanded
                ? $t('system.menu.actions.collapseAll')
                : $t('system.menu.actions.expandAll')
            }}</el-button
          >
        </div>
      </div>
      <div class="table-wrapper">
        <el-table
          ref="tableRef"
          :data="tableData"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          row-key="id"
          @row-click="handleRowClick"
        >
          <el-table-column
            prop="menuName"
            :label="$t('system.menu.columns.menuName')"
            min-width="180"
          />
          <el-table-column
            prop="icon"
            :label="$t('system.menu.columns.icon')"
            align="center"
            width="60"
          >
            <template #default="scope">
              <MenuIcon v-if="scope.row.icon" :name="scope.row.icon" class="el-icon" />
            </template>
          </el-table-column>
          <el-table-column
            prop="menuType"
            :label="$t('system.menu.columns.type')"
            align="center"
            width="80"
          >
            <template #default="scope">
              <el-tag
                :type="menuTypeTag(scope.row.menuType)"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{
                  getDictItem('system_menu_type', scope.row.menuType)?.value || scope.row.menuType
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="sort"
            :label="$t('system.menu.columns.orderNum')"
            align="center"
            width="70"
          />
          <el-table-column
            prop="permission"
            :label="$t('system.menu.columns.perms')"
            align="center"
          />
          <el-table-column
            prop="component"
            :label="$t('system.menu.columns.component')"
            align="center"
          />
          <el-table-column prop="status" :label="$t('system.menu.columns.status')" align="center">
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
          <el-table-column
            prop="createTime"
            :label="$t('system.menu.columns.createTime')"
            align="center"
            min-width="160"
          />
          <el-table-column
            fixed="right"
            :label="$t('system.menu.columns.action')"
            width="120"
            align="center"
          >
            <template #default="scope">
              <el-tooltip
                v-if="scope.row.menuType !== 'B'"
                :content="$t('system.menu.actions.addChild')"
                placement="top"
              >
                <el-button
                  type="success"
                  text
                  bg
                  size="small"
                  @click="handleAddChild(scope.row)"
                  v-permission="['system:menu:add']"
                >
                  <Icon icon="lucide:plus" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.menu.actions.edit')" placement="top">
                <el-button
                  type="warning"
                  text
                  bg
                  size="small"
                  @click="handleModify(scope.row)"
                  v-permission="['system:menu:update']"
                >
                  <Icon icon="lucide:pencil" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.menu.actions.delete')" placement="top">
                <el-button
                  type="danger"
                  text
                  bg
                  size="small"
                  @click="handleRemove(scope.row)"
                  v-permission="['system:menu:delete']"
                >
                  <Icon icon="lucide:trash-2" />
                </el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <el-dialog
      v-model="dialogVisible"
      :title="
        formData.id === undefined ? $t('system.menu.dialogs.add') : $t('system.menu.dialogs.edit')
      "
      width="40%"
      destroy-on-close
      @close="handleClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24" v-show="formData.menuType != 'M'">
            <el-form-item prop="parentId" :label="$t('system.menu.form.parentMenu')">
              <el-tree-select
                v-model="formData.parentId"
                :data="tableData"
                :props="{ label: 'menuName', children: 'children' }"
                value-key="id"
                :placeholder="$t('system.menu.formPlaceholder.parentId')"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="menuType" :label="$t('system.menu.form.menuType')">
              <el-radio-group v-model="formData.menuType">
                <el-radio
                  v-for="item in getDictList('system_menu_type')"
                  :key="item.id"
                  :value="item.label"
                >
                  {{ item.value }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType != 'B'">
            <el-form-item prop="icon" :label="$t('system.menu.form.icon')">
              <icon-select v-model="formData.icon" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="sort" :label="$t('system.menu.form.orderNum')">
              <el-input-number
                v-model="formData.sort"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="menuName" :label="$t('system.menu.form.menuName')">
              <el-input
                v-model="formData.menuName"
                :placeholder="$t('system.menu.formPlaceholder.menuName')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType != 'B'">
            <el-form-item prop="component">
              <template #label>
                <span>
                  <el-tooltip :content="$t('system.menu.tooltip.component')" placement="top">
                    <Icon icon="lucide:help-circle" />
                  </el-tooltip>
                  {{ $t('system.menu.columns.component') }}
                </span>
              </template>
              <el-input
                v-model="formData.component"
                :placeholder="$t('system.menu.formPlaceholder.component')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType != 'B'">
            <el-form-item prop="routeName" :label="$t('system.menu.form.routeName')">
              <el-input
                v-model="formData.routeName"
                :placeholder="$t('system.menu.formPlaceholder.routeName')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType != 'B'">
            <el-form-item prop="path">
              <template #label>
                <span>
                  <el-tooltip :content="$t('system.menu.tooltip.path')" placement="top">
                    <Icon icon="lucide:help-circle" />
                  </el-tooltip>
                  {{ $t('system.menu.form.path') }}
                </span>
              </template>
              <el-input
                v-model="formData.path"
                :placeholder="$t('system.menu.formPlaceholder.path')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType != 'M'">
            <el-form-item prop="permission">
              <template #label>
                <span>
                  <el-tooltip :content="$t('system.menu.tooltip.perms')" placement="top">
                    <Icon icon="lucide:help-circle" />
                  </el-tooltip>
                  {{ $t('system.menu.form.perms') }}
                </span>
              </template>
              <el-input
                v-model="formData.permission"
                :placeholder="$t('system.menu.formPlaceholder.permission')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType == 'C'">
            <el-form-item prop="query">
              <template #label>
                <span>
                  <el-tooltip :content="$t('system.menu.tooltip.query')" placement="top">
                    <Icon icon="lucide:help-circle" />
                  </el-tooltip>
                  {{ $t('system.menu.form.query') }}
                </span>
              </template>
              <el-input
                v-model="formData.query"
                :placeholder="$t('system.menu.formPlaceholder.query')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="visible" :label="$t('system.menu.form.isVisible')">
              <el-radio-group v-model="formData.visible">
                <el-radio
                  v-for="item in getDictList('system_visible')"
                  :key="item.id"
                  :value="item.label"
                >
                  {{ item.value }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="status" :label="$t('system.menu.form.status')">
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
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateOrUpdate">{{
          $t('common.confirm')
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useDict } from '@/common/composables/useDict'
import { Icon } from '@iconify/vue'
import type { FormRules } from 'element-plus'
import { addMenu, modifyById, removeById, treeList } from './apis'
import type { SystemMenuVO, SystemMenuQueryVO, SystemMenuTreeVO } from './apis/type'
import { cloneDeep } from 'lodash-es'
import IconSelect from '@@/components/IconSelect/index.vue'
import MenuIcon from '@@/components/MenuIcon/index.vue'

const { t } = useI18n()
const $t = t

const { loading, getDictList, getDictItem } = useDict([
  'system_status',
  'system_menu_type',
  'system_visible',
])

const searchFormRef = useTemplateRef('searchFormRef')

const tableRef = useTemplateRef('tableRef')

const formRef = useTemplateRef('formRef')

const searchData: SystemMenuQueryVO = reactive({})

const tableData = ref<SystemMenuTreeVO[]>([])

const menuTypeTagMap: Record<string, 'info' | 'primary' | 'warning'> = {
  M: 'info',
  C: 'primary',
  B: 'warning',
}

function menuTypeTag(type?: string) {
  return menuTypeTagMap[type || ''] || 'info'
}

const formData = ref<SystemMenuVO>({
  menuType: 'M',
  visible: '0',
  status: '0',
  icon: '',
})

const formRules = computed<FormRules<SystemMenuVO>>(() => {
  const isButton = formData.value.menuType === 'B'
  return {
    sort: [{ required: true, trigger: 'blur', message: () => $t('system.menu.form.orderNum') }],
    menuName: [{ required: true, trigger: 'blur', message: () => $t('system.menu.form.menuName') }],
    component: isButton
      ? []
      : [{ required: true, trigger: 'blur', message: () => $t('system.menu.form.component') }],
    routeName: isButton
      ? []
      : [{ required: true, trigger: 'blur', message: () => $t('system.menu.form.routeName') }],
    path: isButton
      ? []
      : [{ required: true, trigger: 'blur', message: () => $t('system.menu.form.path') }],
  }
})

const dialogVisible = ref<boolean>(false)

function handleSearch() {
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}

function handleAdd() {
  formData.value = { menuType: 'M', visible: '0', status: '0', icon: '' }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

function handleRowClick(row: SystemMenuTreeVO, _column: any, event: Event) {
  if ((event.target as HTMLElement).closest('.el-button')) return
  if (row.children?.length) {
    tableRef.value?.toggleRowExpansion(row)
  }
}

function handleModify(row: SystemMenuVO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
}

function handleRemove(row: SystemMenuVO) {
  ElMessageBox.confirm(
    $t('system.menu.messages.deleteConfirm', { menuName: row.menuName }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    if (row.id) {
      removeById(row.id).then((data) => {
        ElMessage.success(data.msg || $t('common.messages.deleteSuccess'))
        getTableData()
      })
    }
  })
}

function handleClose() {
  formData.value = { menuType: 'M', visible: '0', status: '0' }
  formRef.value?.clearValidate()
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error($t('system.menu.messages.formError'))
      return
    }
    loading.value = true
    const api = formData.value.id === undefined ? addMenu : modifyById
    api(formData.value)
      .then((data) => {
        ElMessage.success(data.msg || $t('common.messages.operationSuccess'))
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        loading.value = false
      })
  })
}

function getTableData() {
  loading.value = true
  const requestParam = {
    ...searchData,
  }
  treeList(requestParam)
    .then(({ data }) => {
      tableData.value = data
    })
    .catch(() => {
      tableData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

getTableData()

const isExpanded = ref(false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  const table = tableRef.value
  if (!table) return
  const toggleRows = (rows: SystemMenuTreeVO[]) => {
    rows.forEach((row) => {
      table.toggleRowExpansion(row, isExpanded.value)
      if (row.children?.length) {
        toggleRows(row.children)
      }
    })
  }
  toggleRows(tableData.value)
}

function handleAddChild(row: SystemMenuVO) {
  dialogVisible.value = true
  formData.value = {
    menuType: row.menuType === 'M' ? 'C' : 'B',
    visible: '0',
    status: '0',
    parentId: row.id,
    icon: '',
  }
}
</script>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 20px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}

.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}
</style>
