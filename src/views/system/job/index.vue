<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="jobName" label="任务名称">
          <el-input v-model="searchData.jobName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item prop="jobGroup" label="任务组名">
          <el-select
            v-model="searchData.jobGroup"
            placeholder="请选择任务组名"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in getDictList('system_job_group')"
              :key="item.id"
              :label="item.value"
              :value="item.label!"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select
            v-model="searchData.status"
            placeholder="任务状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in getDictList('system_job_status')"
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
          <el-button type="primary" @click="handleAdd" v-permission="['system:job:add']">
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            新增
          </el-button>
          <el-button type="danger" @click="handleBatchRemove" v-permission="['system:job:delete']">
            <template #icon><Icon icon="lucide:trash-2" /></template>
            批量删除
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="jobName" label="任务名称" align="center" min-width="120" />
          <el-table-column prop="jobGroup" label="任务组名" align="center" width="120">
            <template #default="scope">
              {{ getDictItem('system_job_group', scope.row.jobGroup)?.value || scope.row.jobGroup }}
            </template>
          </el-table-column>
          <el-table-column
            prop="invokeTarget"
            label="调度目标"
            align="center"
            min-width="160"
            show-overflow-tooltip
          />
          <el-table-column prop="cronExpression" label="Cron表达式" align="center" width="140" />
          <el-table-column prop="executionPolicy" label="执行策略" align="center" width="100">
            <template #default="scope">
              <el-tag
                :type="
                  getDictItem('system_job_execution_policy', scope.row.executionPolicy)
                    ?.listClass || 'info'
                "
                effect="plain"
                size="small"
                disable-transitions
              >
                {{
                  getDictItem('system_job_execution_policy', scope.row.executionPolicy)?.value ||
                  scope.row.executionPolicy
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="concurrent" label="允许并发" align="center" width="90">
            <template #default="scope">
              <el-tag
                :type="
                  getDictItem('system_job_concurrent', scope.row.concurrent)?.listClass || 'info'
                "
                effect="plain"
                size="small"
                disable-transitions
              >
                {{
                  getDictItem('system_job_concurrent', scope.row.concurrent)?.value ||
                  scope.row.concurrent
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" align="center" width="100">
            <template #default="scope">
              <el-switch
                :model-value="scope.row.status"
                active-value="0"
                inactive-value="1"
                inline-prompt
                active-text="启用"
                inactive-text="暂停"
                @change="(val: any) => handleChangeStatus(scope.row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column
            prop="remark"
            label="备注"
            align="center"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column prop="createTime" label="创建时间" align="center" min-width="160" />
          <el-table-column fixed="right" label="操作" width="210" align="center">
            <template #default="scope">
              <el-button
                type="primary"
                text
                bg
                size="small"
                @click="handleModify(scope.row)"
                v-permission="['system:job:update']"
                >修改</el-button
              >
              <el-button
                type="danger"
                text
                bg
                size="small"
                @click="handleRemove(scope.row)"
                v-permission="['system:job:delete']"
                >删除</el-button
              >
              <el-dropdown
                trigger="hover"
                class="more-dropdown"
                @command="(cmd: string) => handleMoreAction(cmd, scope.row)"
              >
                <el-button text size="small">
                  更多<el-icon class="el-icon--right"><Icon icon="lucide:chevron-down" /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      command="run"
                      :disabled="!checkPermission('system:job:update')"
                    >
                      <Icon icon="lucide:play" /> 执行一次
                    </el-dropdown-item>
                    <el-dropdown-item command="log">
                      <Icon icon="lucide:scroll-text" /> 调度日志
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="page-wrapper">
        <el-pagination
          background
          :layout="paginationData.layout"
          :page-sizes="paginationData.pageSizes"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :current-page="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/修改弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增定时任务' : '修改定时任务'"
      width="55%"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="left"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="jobName" label="任务名称">
              <el-input v-model="formData.jobName" placeholder="请输入任务名称" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="jobGroup" label="任务组名">
              <el-select
                v-model="formData.jobGroup"
                placeholder="请选择任务组名"
                style="width: 100%"
              >
                <el-option
                  v-for="item in getDictList('system_job_group')"
                  :key="item.id"
                  :label="item.value"
                  :value="item.label!"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item prop="invokeTarget" label="调度目标">
          <el-input
            v-model="formData.invokeTarget"
            placeholder="请输入调度目标字符串"
            maxlength="500"
          />
        </el-form-item>
        <el-form-item prop="cronExpression" label="Cron表达式">
          <el-input v-model="formData.cronExpression" placeholder="请选择 Cron 表达式" readonly>
            <template #append>
              <el-button @click="openCronDialog">
                <template #icon><Icon icon="lucide:calendar-clock" /></template>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="executionPolicy" label="执行策略">
              <el-select
                v-model="formData.executionPolicy"
                placeholder="请选择执行策略"
                style="width: 100%"
              >
                <el-option
                  v-for="item in getDictList('system_job_execution_policy')"
                  :key="item.id"
                  :label="item.value"
                  :value="item.label!"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="concurrent" label="允许并发">
              <el-select v-model="formData.concurrent" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in getDictList('system_job_concurrent')"
                  :key="item.id"
                  :label="item.value"
                  :value="item.label!"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item v-if="formData.id !== undefined" prop="status" label="状态">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option
                  v-for="item in getDictList('system_job_status')"
                  :key="item.id"
                  :label="item.value"
                  :value="item.label!"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item prop="remark" label="备注">
          <el-input
            type="textarea"
            v-model="formData.remark"
            placeholder="请输入备注"
            :autosize="{ minRows: 2, maxRows: 4 }"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleCreateOrUpdate"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <!-- Cron 表达式生成弹窗 -->
    <el-dialog
      v-model="cronDialogVisible"
      title="Cron 表达式生成器"
      width="55%"
      @close="handleCronDialogClose"
    >
      <CronGenerator v-model="tempCron" />
      <template #footer>
        <el-button @click="cronDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCron">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { usePagination } from '@@/composables/usePagination'
import { jobPage, addJob, modifyJobById, removeJobByIds, changeJobStatus, runJobOnce } from './apis'
import type { SystemJobQueryVO, SystemJobVO } from './apis/type'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import CronGenerator from '@/common/components/CronGenerator/index.vue'
import { useUserStore } from '@/pinia/stores/user'
import { useRouter } from 'vue-router'

defineOptions({
  name: 'systemJob',
})

const router = useRouter()
const userStore = useUserStore()
const all_permission = '*:*:*'

function checkPermission(perm: string): boolean {
  return userStore.permissions.some((p) => all_permission === p || p === perm)
}

function handleMoreAction(cmd: string, row: SystemJobVO) {
  if (cmd === 'run') {
    handleRunOnce(row)
  } else if (cmd === 'log') {
    router.push({ name: 'JobLog', query: { jobId: row.id } })
  }
}

const { getDictList, getDictItem } = useDict([
  'system_job_status',
  'system_job_execution_policy',
  'system_job_concurrent',
  'system_job_group',
])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const submitLoading = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemJobQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<SystemJobVO[]>([])

const dialogVisible = ref(false)
const formData = ref<SystemJobVO>({})
const formRef = useTemplateRef('formRef')

const cronDialogVisible = ref(false)
const tempCron = ref('')

function openCronDialog() {
  tempCron.value = formData.value.cronExpression || ''
  cronDialogVisible.value = true
}

function confirmCron() {
  formData.value.cronExpression = tempCron.value
  formRef.value?.validateField('cronExpression')
  cronDialogVisible.value = false
}

function handleCronDialogClose() {
  tempCron.value = ''
}

const formRules: FormRules = {
  jobName: [{ required: true, trigger: 'blur', message: '请输入任务名称' }],
  jobGroup: [{ required: true, trigger: 'change', message: '请选择任务组名' }],
  invokeTarget: [{ required: true, trigger: 'blur', message: '请输入调度目标' }],
  cronExpression: [{ required: true, trigger: 'blur', message: '请输入Cron表达式' }],
}

function handleSearch() {
  paginationData.currentPage = 1
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  paginationData.currentPage = 1
  getTableData()
}

function handleAdd() {
  dialogVisible.value = true
}

function handleModify(row: SystemJobVO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
}

function handleClose() {
  formData.value = {}
  formRef.value?.clearValidate()
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error('表单校验不通过')
      return
    }
    submitLoading.value = true
    const api = formData.value.id === undefined ? addJob : modifyJobById
    api(formData.value as any)
      .then((data) => {
        ElMessage.success(data.msg || '操作成功')
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        submitLoading.value = false
      })
  })
}

function handleRemove(row: SystemJobVO) {
  ElMessageBox.confirm(`确认删除任务「${row.jobName}」？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    if (row.id) {
      removeJobByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || '删除成功')
        getTableData()
      })
    }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemJobVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.length} 条任务？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeJobByIds(ids).then((data) => {
      ElMessage.success(data.msg || '删除成功')
      getTableData()
    })
  })
}

function handleChangeStatus(row: SystemJobVO, newStatus: string) {
  if (!row.id) return
  const actionLabel = newStatus === '1' ? '暂停' : '恢复'
  ElMessageBox.confirm(`确认${actionLabel}任务「${row.jobName}」？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    changeJobStatus(row.id!, newStatus).then((data) => {
      ElMessage.success(data.msg || '操作成功')
      getTableData()
    })
  })
}

function handleRunOnce(row: SystemJobVO) {
  if (!row.id) return
  ElMessageBox.confirm(`确认立即执行一次任务「${row.jobName}」？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  }).then(() => {
    runJobOnce(row.id!).then((data) => {
      ElMessage.success(data.msg || '执行成功')
      getTableData()
    })
  })
}

function getTableData() {
  loading.value = true
  const params = {
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  jobPage(params)
    .then(({ data }) => {
      tableData.value = data.rows
      paginationData.total = data.total
    })
    .catch(() => {
      tableData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, {
  immediate: true,
})
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
.page-wrapper {
  display: flex;
  justify-content: flex-end;
}

.more-dropdown {
  margin-left: 2px;

  :deep(.el-dropdown-menu__item) {
    font-size: 12px;
  }
}
</style>
