<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="jobName" :label="$t('system.job.search.jobName')">
          <el-input v-model="searchData.jobName" :placeholder="$t('system.job.formPlaceholder.jobName')" />
        </el-form-item>
        <el-form-item prop="jobGroup" :label="$t('system.job.search.jobGroup')">
          <el-select
            v-model="searchData.jobGroup"
            :placeholder="$t('system.job.formPlaceholder.jobGroup')"
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
        <el-form-item prop="status" :label="$t('system.job.search.status')">
          <el-select
            v-model="searchData.status"
            :placeholder="$t('system.job.search.statusPlaceholder')"
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
            <template #icon><Icon icon="lucide:search" /></template>{{ $t('system.job.actions.query') }}
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>{{ $t('system.job.actions.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" @click="handleAdd" v-permission="['system:job:add']">
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            {{ $t('system.job.actions.add') }}
          </el-button>
          <el-button type="danger" @click="handleBatchRemove" v-permission="['system:job:delete']">
            <template #icon><Icon icon="lucide:trash-2" /></template>
            {{ $t('system.job.actions.batchDelete') }}
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="jobName" :label="$t('system.job.columns.jobName')" align="center" min-width="120" />
          <el-table-column prop="jobGroup" :label="$t('system.job.columns.jobGroup')" align="center" width="120">
            <template #default="scope">
              {{ getDictItem('system_job_group', scope.row.jobGroup)?.value || scope.row.jobGroup }}
            </template>
          </el-table-column>
          <el-table-column
            prop="invokeTarget"
            :label="$t('system.job.columns.invokeTarget')"
            align="center"
            min-width="160"
            show-overflow-tooltip
          />
          <el-table-column prop="cronExpression" :label="$t('system.job.columns.cronExpression')" align="center" width="140" />
          <el-table-column prop="executionPolicy" :label="$t('system.job.columns.executionPolicy')" align="center" width="100">
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
          <el-table-column prop="concurrent" :label="$t('system.job.columns.concurrent')" align="center" width="90">
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
          <el-table-column prop="status" :label="$t('system.job.columns.status')" align="center" width="100">
            <template #default="scope">
              <el-switch
                :model-value="scope.row.status"
                active-value="0"
                inactive-value="1"
                inline-prompt
                :active-text="$t('system.job.status.enable')"
                :inactive-text="$t('system.job.status.disable')"
                @change="(val: any) => handleChangeStatus(scope.row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column
            prop="remark"
            :label="$t('system.job.columns.remark')"
            align="center"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column prop="createTime" :label="$t('system.job.columns.createTime')" align="center" min-width="160" />
          <el-table-column fixed="right" :label="$t('system.job.columns.action')" width="150" align="center">
            <template #default="scope">
              <el-tooltip :content="$t('system.job.actions.edit')" placement="top">
                <el-button
                  type="warning"
                  text
                  bg
                  size="small"
                  @click="handleModify(scope.row)"
                  v-permission="['system:job:update']"
                >
                  <Icon icon="lucide:pencil" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.job.actions.delete')" placement="top">
                <el-button
                  type="danger"
                  text
                  bg
                  size="small"
                  @click="handleRemove(scope.row)"
                  v-permission="['system:job:delete']"
                >
                  <Icon icon="lucide:trash-2" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.job.actions.run')" placement="top">
                <el-button
                  type="primary"
                  text
                  bg
                  size="small"
                  @click="handleRunOnce(scope.row)"
                  v-permission="['system:job:update']"
                >
                  <Icon icon="lucide:play" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.job.actions.log')" placement="top">
                <el-button
                  text
                  bg
                  size="small"
                  @click="$router.push({ name: 'JobLog', query: { jobId: scope.row.id } })"
                >
                  <Icon icon="lucide:scroll-text" />
                </el-button>
              </el-tooltip>
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
      :title="formData.id === undefined ? $t('system.job.dialogs.addJob') : $t('system.job.dialogs.editJob')"
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
            <el-form-item prop="jobName" :label="$t('system.job.search.jobName')">
              <el-input v-model="formData.jobName" :placeholder="$t('system.job.formPlaceholder.jobName')" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="jobGroup" :label="$t('system.job.search.jobGroup')">
              <el-select
                v-model="formData.jobGroup"
                :placeholder="$t('system.job.formPlaceholder.jobGroup')"
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
        <el-form-item prop="invokeTarget" :label="$t('system.job.form.invokeTarget')">
          <el-input
            v-model="formData.invokeTarget"
            :placeholder="$t('system.job.formPlaceholder.invokeTarget')"
            maxlength="500"
          />
        </el-form-item>
        <el-form-item prop="cronExpression" :label="$t('system.job.form.cronExpression')">
          <el-input v-model="formData.cronExpression" :placeholder="$t('system.job.formPlaceholder.cronExpression')" readonly>
            <template #append>
              <el-button @click="openCronDialog">
                <template #icon><Icon icon="lucide:calendar-clock" /></template>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="executionPolicy" :label="$t('system.job.form.executionPolicy')">
              <el-select
                v-model="formData.executionPolicy"
                :placeholder="$t('system.job.formPlaceholder.executionPolicy')"
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
            <el-form-item prop="concurrent" :label="$t('system.job.form.concurrent')">
              <el-select v-model="formData.concurrent" :placeholder="$t('system.job.formPlaceholder.concurrent')" style="width: 100%">
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
            <el-form-item v-if="formData.id !== undefined" prop="status" :label="$t('system.job.form.status')">
              <el-select v-model="formData.status" :placeholder="$t('system.job.formPlaceholder.status')" style="width: 100%">
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
        <el-form-item prop="remark" :label="$t('system.job.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.job.formPlaceholder.remark')"
            :autosize="{ minRows: 2, maxRows: 4 }"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleCreateOrUpdate"
          >{{ $t('common.confirm') }}</el-button
        >
      </template>
    </el-dialog>

    <!-- Cron 表达式生成弹窗 -->
    <el-dialog
      v-model="cronDialogVisible"
      :title="$t('system.job.tooltip.cronGenerator')"
      width="55%"
      @close="handleCronDialogClose"
    >
      <CronGenerator v-model="tempCron" />
      <template #footer>
        <el-button @click="cronDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmCron">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n"
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { usePagination } from '@@/composables/usePagination'
import { jobPage, addJob, modifyJobById, removeJobByIds, changeJobStatus, runJobOnce } from './apis'
import type { SystemJobQueryVO, SystemJobVO } from './apis/type'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import CronGenerator from '@/common/components/CronGenerator/index.vue'

const { t } = useI18n(); const $t = t

defineOptions({
  name: 'systemJob',
})

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
  jobName: [{ required: true, trigger: 'blur', message: () => $t('system.job.formPlaceholder.jobName') }],
  jobGroup: [{ required: true, trigger: 'change', message: () => $t('system.job.formPlaceholder.jobGroup') }],
  invokeTarget: [{ required: true, trigger: 'blur', message: () => $t('system.job.formPlaceholder.invokeTarget') }],
  cronExpression: [{ required: true, trigger: 'blur', message: () => $t('system.job.formPlaceholder.cronExpression') }],
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
      ElMessage.error($t('system.job.messages.formError'))
      return
    }
    submitLoading.value = true
    const api = formData.value.id === undefined ? addJob : modifyJobById
    api(formData.value as any)
      .then((data) => {
        ElMessage.success(data.msg || $t('system.job.messages.operationSuccess'))
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        submitLoading.value = false
      })
  })
}

function handleRemove(row: SystemJobVO) {
  ElMessageBox.confirm($t('system.job.messages.deleteConfirm', { jobName: row.jobName }), $t('common.messages.confirmTitle'), {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    type: 'warning',
  }).then(() => {
    if (row.id) {
      removeJobByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || $t('system.job.messages.deleteSuccess'))
        getTableData()
      })
    }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemJobVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning($t('system.job.messages.selectFirst'))
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm($t('system.job.messages.batchDeleteConfirm', { count: selectedRows.length }), $t('common.messages.confirmTitle'), {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    type: 'warning',
  }).then(() => {
    removeJobByIds(ids).then((data) => {
      ElMessage.success(data.msg || $t('system.job.messages.deleteSuccess'))
      getTableData()
    })
  })
}

function handleChangeStatus(row: SystemJobVO, newStatus: string) {
  if (!row.id) return
  const actionLabel = newStatus === '1' ? $t('system.job.status.disable') : $t('system.job.status.enable')
  ElMessageBox.confirm($t('system.job.messages.statusConfirm', { action: actionLabel, jobName: row.jobName }), $t('common.messages.confirmTitle'), {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    type: 'warning',
  }).then(() => {
    changeJobStatus(row.id!, newStatus).then((data) => {
      ElMessage.success(data.msg || $t('system.job.messages.operationSuccess'))
      getTableData()
    })
  })
}

function handleRunOnce(row: SystemJobVO) {
  if (!row.id) return
  ElMessageBox.confirm($t('system.job.messages.runConfirm', { jobName: row.jobName }), $t('common.messages.confirmTitle'), {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    type: 'info',
  }).then(() => {
    runJobOnce(row.id!).then((data) => {
      ElMessage.success(data.msg || $t('system.job.messages.runSuccess'))
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
</style>
