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
        <el-form-item prop="status" label="执行状态">
          <el-select
            v-model="searchData.status"
            placeholder="执行状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in getDictList('system_job_log_status')"
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
          <el-table-column prop="jobGroup" label="任务组名" align="center" width="120" />
          <el-table-column
            prop="invokeTarget"
            label="调度目标"
            align="center"
            min-width="160"
            show-overflow-tooltip
          />
          <el-table-column
            prop="jobMessage"
            label="日志信息"
            align="center"
            min-width="200"
            show-overflow-tooltip
          />
          <el-table-column prop="status" label="执行状态" align="center" width="90">
            <template #default="scope">
              <el-tag
                :type="
                  getDictItem('system_job_log_status', scope.row.status ?? '')?.listClass || 'info'
                "
                effect="plain"
                size="small"
                disable-transitions
              >
                {{
                  getDictItem('system_job_log_status', scope.row.status ?? '')?.value ||
                  scope.row.status
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="remark"
            label="备注"
            align="center"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column prop="createTime" label="执行时间" align="center" min-width="160" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleDetail(scope.row)"
                >详情</el-button
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="任务日志详情" width="45%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务名称">{{ detailData.jobName }}</el-descriptions-item>
        <el-descriptions-item label="任务组名">{{ detailData.jobGroup }}</el-descriptions-item>
        <el-descriptions-item label="调度目标" :span="2">{{
          detailData.invokeTarget
        }}</el-descriptions-item>
        <el-descriptions-item label="执行状态">
          <el-tag
            :type="
              getDictItem('system_job_log_status', detailData.status ?? '')?.listClass || 'info'
            "
            effect="plain"
            size="small"
          >
            {{
              getDictItem('system_job_log_status', detailData.status ?? '')?.value ||
              detailData.status
            }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="执行时间">{{ detailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="日志信息" :span="2">
          <el-input
            v-if="detailData.jobMessage"
            type="textarea"
            :model-value="detailData.jobMessage"
            readonly
            :autosize="{ minRows: 2, maxRows: 8 }"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.remark" label="备注" :span="2">{{
          detailData.remark
        }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { usePagination } from '@@/composables/usePagination'
import { jobLogPage, removeJobLogByIds } from './apis'
import type { SystemJobLogQueryVO, SystemJobLogVO } from './apis/type'

defineOptions({
  name: 'jobLog',
})

const { getDictList, getDictItem } = useDict(['system_job_log_status', 'system_job_group'])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemJobLogQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<SystemJobLogVO[]>([])

const detailVisible = ref(false)
const detailData = ref<SystemJobLogVO>({})

function handleSearch() {
  paginationData.currentPage = 1
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  paginationData.currentPage = 1
  getTableData()
}

function handleDetail(row: SystemJobLogVO) {
  detailData.value = row
  detailVisible.value = true
}

function handleRemove(row: SystemJobLogVO) {
  ElMessageBox.confirm(`确认删除该条任务日志？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    if (row.id) {
      removeJobLogByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || '删除成功')
        getTableData()
      })
    }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemJobLogVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.length} 条任务日志？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeJobLogByIds(ids).then((data) => {
      ElMessage.success(data.msg || '删除成功')
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
  jobLogPage(params)
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
