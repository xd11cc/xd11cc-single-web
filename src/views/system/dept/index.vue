<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="deptName" label="部门名称">
          <el-input v-model="searchData.deptName" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select
            v-model="searchData.status"
            placeholder="部门状态"
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
            <template #icon><Icon icon="lucide:search" /></template>查询
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" @click="handleAdd" v-permission="['system:dept:add']">
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            新增
          </el-button>
          <el-button @click="toggleExpand">
            <template #icon><Icon icon="lucide:arrow-up-down" /></template>
            {{ isExpanded ? '收起全部' : '展开全部' }}
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
          <el-table-column prop="deptName" label="部门名称" min-width="180" />
          <el-table-column prop="deptCode" label="部门编码" align="center" />
          <el-table-column prop="sort" label="排序" align="center" width="80" />
          <el-table-column prop="status" label="状态" align="center" width="80">
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
          <el-table-column prop="remark" label="备注" align="center" />
          <el-table-column
            prop="createTime"
            label="创建时间"
            align="center"
            min-width="160"
           
          />
          <el-table-column fixed="right" label="操作" width="200" align="center">
            <template #default="scope">
              <el-button
                type="success"
                text
                bg
                size="small"
                @click="handleAddChild(scope.row)"
                v-permission="['system:dept:add']"
                >新增</el-button
              >
              <el-button
                type="warning"
                text
                bg
                size="small"
                @click="handleModify(scope.row)"
                v-permission="['system:dept:update']"
                >修改</el-button
              >
              <el-button
                type="danger"
                text
                bg
                size="small"
                @click="handleRemove(scope.row)"
                v-permission="['system:dept:delete']"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 新增、修改弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增部门' : '修改部门'"
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
        <el-form-item prop="parentId" label="上级部门">
          <el-tree-select
            v-model="formData.parentId"
            :data="tableData"
            :props="{ label: 'deptName', children: 'children' }"
            value-key="id"
            placeholder="不选则为顶级部门"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="deptName" label="部门名称">
              <el-input v-model="formData.deptName" placeholder="请输入部门名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="deptCode" label="部门编码">
              <el-input v-model="formData.deptCode" placeholder="请输入部门编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="sort" label="显示排序">
              <el-input-number
                v-model="formData.sort"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="leaderId" label="负责人">
              <el-select
                v-model="formData.leaderId"
                placeholder="请选择负责人"
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
            <el-form-item prop="status" label="状态">
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
            <el-form-item prop="remark" label="备注">
              <el-input
                type="textarea"
                v-model="formData.remark"
                placeholder="请输入内容"
                autosize
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateOrUpdate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { deptTreeList, addDept, modifyDeptById, removeDeptById } from './apis'
import type { SystemDeptVO, SystemDeptTreeVO, SystemDeptQueryVO } from './apis/type'
import { userList } from '@/views/system/user/apis'

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
  deptCode: [{ required: true, trigger: 'blur', message: '请输入部门编码' }],
  deptName: [{ required: true, trigger: 'blur', message: '请输入部门名称' }],
  leaderId: [{ required: true, trigger: 'change', message: '请选择负责人' }],
  sort: [{ required: true, trigger: 'blur', message: '请输入显示排序' }],
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
        ElMessage.success(res.msg || '操作成功')
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
    ElMessage.warning('该部门下存在子部门，无法删除')
    return
  }
  ElMessageBox.confirm(`正在删除部门「${row.deptName}」，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeDeptById(row.id!).then((res) => {
      ElMessage.success(res.msg || '删除成功')
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
