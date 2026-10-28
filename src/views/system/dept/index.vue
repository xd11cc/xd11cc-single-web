<template>
  <TreeCrudView
    :slotProps="crud.slotProps"
    :formRules="formRules"
    :add-title="$t('system.dept.dialogs.add')"
    :edit-title="$t('system.dept.dialogs.edit')"
    dialog-width="min(720px, calc(100vw - 32px))"
    label-width="144px"
    :default-expanded="true"
  >
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="deptName" :label="$t('system.dept.form.deptName')">
        <el-input
          v-model="searchData.deptName"
          :placeholder="$t('system.dept.formPlaceholder.deptName')"
        />
      </el-form-item>
      <el-form-item prop="status" :label="$t('system.dept.form.status')">
        <el-select
          v-model="searchData.status"
          :placeholder="$t('system.dept.formPlaceholder.status')"
          clearable
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

    <!-- 工具栏：新增按钮；展开/收起由壳统一提供 -->
    <template #actions="{ handleAdd }">
      <el-button type="primary" @click="handleAdd" v-permission="['system:dept:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>
        {{ $t('system.dept.actions.add') }}
      </el-button>
    </template>

    <!-- 表格列 -->
    <template #table="{ handleAddChild, handleEdit, handleRemove }">
      <el-table-column prop="deptName" :label="$t('system.dept.search.deptName')" min-width="180" />
      <el-table-column prop="deptCode" :label="$t('system.dept.columns.deptCode')" />
      <el-table-column
        prop="sort"
        :label="$t('system.dept.columns.sort')"
        align="right"
        width="80"
      />
      <el-table-column
        prop="status"
        :label="$t('system.dept.search.status')"
        align="center"
        width="80"
      >
        <template #default="scope">
          <el-tag
            :type="getDictItem('system_status', scope.row.status)?.listClass || 'info'"
            effect="plain"
            size="small"
            disable-transitions
          >
            {{ getDictItem('system_status', scope.row.status)?.value }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" :label="$t('system.dept.columns.remark')" />
      <el-table-column
        prop="createTime"
        :label="$t('system.dept.columns.createTime')"
        align="center"
        min-width="160"
      />
      <el-table-column fixed="right" :label="$t('common.action')" width="120" align="center">
        <template #default="scope">
          <el-tooltip :content="$t('system.dept.actions.addChild')" placement="top">
            <el-button
              type="success"
              text
              bg
              size="small"
              @click="handleAddChild(scope.row)"
              v-permission="['system:dept:add']"
            >
              <Icon icon="lucide:plus" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('system.dept.actions.edit')" placement="top">
            <el-button
              type="warning"
              text
              bg
              size="small"
              @click="handleEdit(scope.row)"
              v-permission="['system:dept:update']"
            >
              <Icon icon="lucide:pencil" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('system.dept.actions.delete')" placement="top">
            <el-button
              type="danger"
              text
              bg
              size="small"
              @click="handleRemove(scope.row)"
              v-permission="['system:dept:delete']"
            >
              <Icon icon="lucide:trash-2" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </template>

    <!-- 新增/修改表单字段 -->
    <template #form-fields="{ formData, treeData }">
      <el-col :span="24">
        <el-form-item prop="parentId" :label="$t('system.dept.form.parentId')">
          <el-tree-select
            v-model="formData.parentId"
            :data="treeData"
            :props="{ label: 'deptName', children: 'children' }"
            value-key="id"
            :placeholder="$t('system.dept.formPlaceholder.parentId')"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="deptName" :label="$t('system.dept.form.deptName')">
          <el-input
            v-model="formData.deptName"
            :placeholder="$t('system.dept.formPlaceholder.deptName')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="deptCode" :label="$t('system.dept.form.deptCode')">
          <el-input
            v-model="formData.deptCode"
            :placeholder="$t('system.dept.formPlaceholder.deptCode')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="sort" :label="$t('system.dept.form.orderNum')">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="leaderId" :label="$t('system.dept.form.leaderId')">
          <el-select
            v-model="formData.leaderId"
            :placeholder="$t('system.dept.formPlaceholder.leaderId')"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in leaderOptions"
              :key="item.id"
              :label="item.nickname"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="status" :label="$t('system.dept.form.status')">
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
        <el-form-item prop="remark" :label="$t('system.dept.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.dept.formPlaceholder.remark')"
            autosize
            maxlength="200"
            show-word-limit
          />
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
import { deptTreeList, addDept, modifyDeptById, removeDeptById } from './apis'
import { userList } from '@/views/system/user/apis'
import type { SystemDeptQueryVO, SystemDeptTreeVO } from './apis/type'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'dept',
})

const { getDictList, getDictItem } = useDict(['system_status'])

const leaderOptions = ref<{ id: number; nickname: string }[]>([])

const formRules: FormRules = {
  deptCode: [{ required: true, trigger: 'blur', message: () => $t('system.dept.form.deptCode') }],
  deptName: [{ required: true, trigger: 'blur', message: () => $t('system.dept.form.deptName') }],
  leaderId: [{ required: true, trigger: 'change', message: () => $t('system.dept.form.leaderId') }],
  sort: [{ required: true, trigger: 'blur', message: () => $t('system.dept.form.orderNum') }],
}

const crud = useTreeCrud<SystemDeptQueryVO, SystemDeptTreeVO>({
  treeApi: (query) => deptTreeList(query),
  addApi: (data) => addDept(data as any),
  updateApi: (data) => modifyDeptById(data as any),
  removeApi: (id) => removeDeptById(id as number),
  defaultForm: () => ({ status: '0', sort: 0 }),
  removeConfirmText: (row) => $t('system.dept.messages.deleteConfirm', { deptName: row?.deptName }),
  // 有子节点不允许删除
  removeGuard: (row) =>
    row?.children?.length ? $t('system.dept.messages.hasChildren') : undefined,
})

function getUserList() {
  userList().then(({ data }) => {
    leaderOptions.value = data.map((u) => ({ id: u.id!, nickname: u.nickname || u.username || '' }))
  })
}

// 树数据与负责人下拉在挂载时加载
crud.refresh()
getUserList()
</script>
