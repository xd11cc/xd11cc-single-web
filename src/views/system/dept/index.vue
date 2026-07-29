<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
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
            style="width: 150px"
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
            <template #icon><Icon icon="lucide:search" /></template>{{ $t('common.search') }}
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>{{ $t('common.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" @click="handleAdd" v-permission="['system:dept:add']">
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            {{ $t('system.dept.actions.add') }}
          </el-button>
          <el-button @click="toggleExpand">
            <template #icon><Icon icon="lucide:arrow-up-down" /></template>
            {{
              isExpanded
                ? $t('system.dept.actions.collapseAll')
                : $t('system.dept.actions.expandAll')
            }}
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table
          ref="tableRef"
          :data="tableData"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          row-key="id"
          default-expand-all
          @row-click="handleRowClick"
        >
          <el-table-column
            prop="deptName"
            :label="$t('system.dept.search.deptName')"
            min-width="180"
          />
          <el-table-column
            prop="deptCode"
            :label="$t('system.dept.columns.deptCode')"
            align="center"
          />
          <el-table-column
            prop="sort"
            :label="$t('system.dept.columns.sort')"
            align="center"
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
          <el-table-column prop="remark" :label="$t('system.dept.columns.remark')" align="center" />
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
                  @click="handleModify(scope.row)"
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
        </el-table>
      </div>
    </el-card>

    <!-- 新增、修改弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="
        formData.id === undefined ? $t('system.dept.dialogs.add') : $t('system.dept.dialogs.edit')
      "
      width="35%"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        label-position="left"
      >
        <el-form-item prop="parentId" :label="$t('system.dept.form.parentId')">
          <el-tree-select
            v-model="formData.parentId"
            :data="tableData"
            :props="{ label: 'deptName', children: 'children' }"
            value-key="id"
            :placeholder="$t('system.dept.formPlaceholder.parentId')"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-row :gutter="20">
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
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { deptTreeList, addDept, modifyDeptById, removeDeptById } from './apis'
import type { SystemDeptVO, SystemDeptTreeVO, SystemDeptQueryVO } from './apis/type'
import { userList } from '@/views/system/user/apis'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'dept',
})

const { getDictList, getDictItem } = useDict(['system_status'])

const loading = ref(false)
const dialogVisible = ref(false)
const isExpanded = ref(true)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemDeptQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<SystemDeptTreeVO[]>([])

const formRef = useTemplateRef('formRef')
const formData = ref<SystemDeptVO>({ status: '0', sort: 0 })

const leaderOptions = ref<{ id: number; nickname: string }[]>([])

const formRules: FormRules = {
  deptCode: [{ required: true, trigger: 'blur', message: () => $t('system.dept.form.deptCode') }],
  deptName: [{ required: true, trigger: 'blur', message: () => $t('system.dept.form.deptName') }],
  leaderId: [{ required: true, trigger: 'change', message: () => $t('system.dept.form.leaderId') }],
  sort: [{ required: true, trigger: 'blur', message: () => $t('system.dept.form.orderNum') }],
}

function handleSearch() {
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}

function handleAdd() {
  dialogVisible.value = true
  formData.value = { status: '0', sort: 0 }
}

function handleAddChild(row: SystemDeptTreeVO) {
  dialogVisible.value = true
  formData.value = { status: '0', sort: 0, parentId: row.id }
}

function handleModify(row: SystemDeptTreeVO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
}

function handleClose() {
  formData.value = { status: '0', sort: 0 }
  formRef.value?.clearValidate()
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    loading.value = true
    const isAdd = formData.value.id === undefined
    const api = isAdd ? addDept(formData.value as any) : modifyDeptById(formData.value as any)
    api
      .then((res) => {
        ElMessage.success(res.msg || $t('system.dept.messages.operationSuccess'))
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        loading.value = false
      })
  })
}

function handleRemove(row: SystemDeptTreeVO) {
  if (row.children?.length) {
    ElMessage.warning($t('system.dept.messages.hasChildren'))
    return
  }
  ElMessageBox.confirm(
    $t('system.dept.messages.deleteConfirm', { deptName: row.deptName }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    removeDeptById(row.id!).then((res) => {
      ElMessage.success(res.msg || $t('common.messages.operationSuccess'))
      getTableData()
    })
  })
}

function handleRowClick(row: SystemDeptTreeVO) {
  if (row.children?.length) {
    tableRef.value?.toggleRowExpansion(row)
  }
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  const table = tableRef.value
  if (!table) return
  const toggleRows = (rows: SystemDeptTreeVO[]) => {
    rows.forEach((row) => {
      table.toggleRowExpansion(row, isExpanded.value)
      if (row.children?.length) {
        toggleRows(row.children)
      }
    })
  }
  toggleRows(tableData.value)
}

function getTableData() {
  loading.value = true
  deptTreeList({ ...searchData })
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

function getUserList() {
  userList().then(({ data }) => {
    leaderOptions.value = data.map((u) => ({ id: u.id!, nickname: u.nickname || u.username || '' }))
  })
}

getTableData()
getUserList()
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
