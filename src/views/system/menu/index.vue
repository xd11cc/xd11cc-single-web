<template>
  <TreeCrudView
    :slotProps="crud.slotProps"
    :formRules="formRules"
    :add-title="$t('system.menu.dialogs.add')"
    :edit-title="$t('system.menu.dialogs.edit')"
    :columns="columns"
    label-width="144px"
    :default-expanded="false"
  >
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
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
          class="search-field-lg"
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

    <!-- 工具栏：新增按钮；展开/收起由壳统一提供 -->
    <template #actions="{ handleAdd }">
      <el-button type="primary" @click="handleAdd" v-permission="['system:menu:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>
        {{ $t('system.menu.actions.add') }}
      </el-button>
    </template>

    <!-- 树列：固定在生成列之前 -->
    <template #table-prefix>
      <el-table-column
        prop="menuName"
        :label="$t('system.menu.columns.menuName')"
        min-width="180"
        show-overflow-tooltip
      />
    </template>

    <!-- 图标列：图标名来自后端菜单 -->
    <template #cell-icon="{ row }">
      <MenuIcon v-if="row.icon" :name="row.icon" class="el-icon" />
    </template>

    <!-- 类型列：字典标签 -->
    <template #cell-menuType="{ row }">
      <el-tag :type="menuTypeTag(row.menuType)" effect="plain" size="small" disable-transitions>
        {{ getDictItem('system_menu_type', row.menuType)?.label || row.menuType }}
      </el-tag>
    </template>

    <!-- 状态列：字典标签 -->
    <template #cell-status="{ row }">
      <el-tag
        :type="getDictItem('system_status', row.status)?.listClass || 'info'"
        effect="plain"
        disable-transitions
      >
        {{ getDictItem('system_status', row.status)?.label }}
      </el-tag>
    </template>

    <!-- 操作列 -->
    <template #table-append="{ handleAddChild, handleEdit, handleRemove }">
      <el-table-column fixed="right" :label="$t('common.action')" width="120" align="center">
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
              @click="handleEdit(scope.row)"
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
    </template>

    <!-- 新增/修改表单字段 -->
    <template #form-fields="{ formData, treeData }">
      <el-col v-show="formData.menuType != 'M'" :span="24">
        <el-form-item prop="parentId" :label="$t('system.menu.form.parentMenu')">
          <el-tree-select
            v-model="formData.parentId"
            :data="treeData"
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
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col v-show="formData.menuType != 'B'" :xs="24" :sm="12">
        <el-form-item prop="icon" :label="$t('system.menu.form.icon')">
          <IconSelect v-model="formData.icon" />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item prop="sort" :label="$t('system.menu.form.orderNum')">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item prop="menuName" :label="$t('system.menu.form.menuName')">
          <el-input
            v-model="formData.menuName"
            :placeholder="$t('system.menu.formPlaceholder.menuName')"
          />
        </el-form-item>
      </el-col>
      <el-col v-show="formData.menuType != 'B'" :xs="24" :sm="12">
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
      <el-col v-show="formData.menuType != 'B'" :xs="24" :sm="12">
        <el-form-item prop="routeName" :label="$t('system.menu.form.routeName')">
          <el-input
            v-model="formData.routeName"
            :placeholder="$t('system.menu.formPlaceholder.routeName')"
          />
        </el-form-item>
      </el-col>
      <el-col v-show="formData.menuType != 'B'" :xs="24" :sm="12">
        <el-form-item prop="path">
          <template #label>
            <span>
              <el-tooltip :content="$t('system.menu.tooltip.path')" placement="top">
                <Icon icon="lucide:help-circle" />
              </el-tooltip>
              {{ $t('system.menu.form.path') }}
            </span>
          </template>
          <el-input v-model="formData.path" :placeholder="$t('system.menu.formPlaceholder.path')" />
        </el-form-item>
      </el-col>
      <el-col v-show="formData.menuType != 'M'" :xs="24" :sm="12">
        <el-form-item prop="permission" :label="$t('system.menu.form.perms')">
          <el-input
            v-model="formData.permission"
            :placeholder="$t('system.menu.formPlaceholder.permission')"
          />
        </el-form-item>
      </el-col>
      <el-col v-show="formData.menuType == 'C'" :xs="24" :sm="12">
        <el-form-item prop="query" :label="$t('system.menu.form.query')">
          <el-input
            v-model="formData.query"
            :placeholder="$t('system.menu.formPlaceholder.query')"
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item prop="visible" :label="$t('system.menu.form.isVisible')">
          <el-radio-group v-model="formData.visible">
            <el-radio
              v-for="item in getDictList('system_visible')"
              :key="item.id"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item prop="status" :label="$t('system.menu.form.status')">
          <el-radio-group v-model="formData.status">
            <el-radio
              v-for="item in getDictList('system_status')"
              :key="item.id"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
    </template>
  </TreeCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import type { FormRules } from 'element-plus'
import TreeCrudView from '@/common/components/treeCrud/index.vue'
import { useTreeCrud } from '@/common/composables/useTreeCrud'
import { useDict } from '@/common/composables/useDict'
import IconSelect from '@@/components/IconSelect/index.vue'
import MenuIcon from '@@/components/MenuIcon/index.vue'
import { addMenu, modifyById, removeById, treeList } from './apis'
import type { SystemMenuVO, SystemMenuQueryVO, SystemMenuTreeVO } from './apis/type'
import type { TableColumnDef } from '@@/composables/useTableColumns'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'Menu',
})

const { getDictList, getDictItem } = useDict([
  'system_status',
  'system_menu_type',
  'system_visible',
])

const menuTypeTagMap: Record<string, 'info' | 'primary' | 'warning'> = {
  M: 'info',
  C: 'primary',
  B: 'warning',
}

function menuTypeTag(type?: string) {
  return menuTypeTagMap[type || ''] || 'info'
}

// 列定义：排序 / 显隐 / 列宽由壳统一管理（树列固定在 #table-prefix）
const columns = computed<TableColumnDef[]>(() => [
  { prop: 'icon', label: $t('system.menu.columns.icon'), align: 'center', width: 70 },
  { prop: 'menuType', label: $t('system.menu.columns.type'), align: 'center', width: 90 },
  { prop: 'sort', label: $t('system.menu.columns.orderNum'), align: 'right', width: 80 },
  { prop: 'permission', label: $t('system.menu.columns.perms') },
  { prop: 'component', label: $t('system.menu.columns.component') },
  { prop: 'status', label: $t('system.menu.columns.status'), align: 'center', width: 90 },
  {
    prop: 'createTime',
    label: $t('system.menu.columns.createTime'),
    align: 'center',
    minWidth: 160,
  },
])

const crud = useTreeCrud<SystemMenuQueryVO, SystemMenuTreeVO>({
  treeApi: (query) => treeList(query),
  addApi: (data) => addMenu(data),
  updateApi: (data) => modifyById(data),
  removeApi: (id) => removeById(id as number),
  defaultForm: () => ({ menuType: 'M', visible: '0', status: '0', icon: '', sort: 0 }),
  // 目录下只能加菜单，菜单下只能加按钮
  childForm: (parent) => ({
    menuType: parent?.menuType === 'M' ? 'C' : 'B',
    visible: '0',
    status: '0',
    icon: '',
    parentId: parent?.id,
  }),
  removeConfirmText: (row) => $t('system.menu.messages.deleteConfirm', { menuName: row?.menuName }),
})

// 按钮类型不需要「组件路径 / 路由名 / 路由路径」，校验规则随类型变化
const formRules = computed<FormRules<SystemMenuVO>>(() => {
  const isButton = crud.state.formData.value?.menuType === 'B'
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

// 树数据在挂载时加载（树形壳不自动拉取，需要页面显式触发）
crud.refresh()
</script>
