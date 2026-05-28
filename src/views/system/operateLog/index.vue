<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="module" label="操作模块">
          <el-input v-model="searchData.module" placeholder="请输入操作模块" />
        </el-form-item>
        <el-form-item prop="operateType" label="操作类型">
          <el-select v-model="searchData.operateType" placeholder="操作类型" clearable style="width: 150px">
            <el-option
              v-for="item in getDictList('system_operate_type')"
              :key="item.id"
              :label="item.value"
              :value="item.label!"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select v-model="searchData.status" placeholder="操作状态" clearable style="width: 150px">
            <el-option
              v-for="item in getDictList('system_operate_status')"
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
          <el-button
            type="danger"
            @click="handleBatchRemove"
            v-permission="['system:operateLog:delete']"
          >
            <template #icon><Icon icon="lucide:trash-2" /></template>
            批量删除
          </el-button>
          <el-button
            type="danger"
            plain
            @click="handleClean"
            v-permission="['system:operateLog:clean']"
          >
            <template #icon><Icon icon="lucide:trash" /></template>
            清空
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="module" label="操作模块" align="center" />
          <el-table-column prop="operateType" label="操作类型" align="center" width="100">
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_operate_type', scope.row.operateType)?.listClass || 'info'"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{ getDictItem('system_operate_type', scope.row.operateType)?.value || scope.row.operateType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="requestMethod" label="请求方式" align="center" width="100" />
          <el-table-column prop="operateIp" label="操作IP" align="center" width="140" />
          <el-table-column prop="status" label="状态" align="center" width="80">
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_operate_status', scope.row.status)?.listClass || 'info'"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{ getDictItem('system_operate_status', scope.row.status)?.value || scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="costTime" label="耗时" align="center" width="100">
            <template #default="scope">
              {{ scope.row.costTime }}ms
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="操作时间" align="center" min-width="160" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button
                type="primary"
                text
                bg
                size="small"
                @click="handleDetail(scope.row)"
              >详情</el-button>
              <el-button
                type="danger"
                text
                bg
                size="small"
                @click="handleRemove(scope.row)"
                v-permission="['system:operateLog:delete']"
              >删除</el-button>
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
    <el-dialog v-model="detailVisible" title="操作日志详情" width="50%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="操作模块">{{ detailData.module }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          {{ getDictItem('system_operate_type', detailData.operateType)?.value || detailData.operateType }}
        </el-descriptions-item>
        <el-descriptions-item label="请求方式">{{ detailData.requestMethod }}</el-descriptions-item>
        <el-descriptions-item label="操作状态">
          <el-tag
            :type="getDictItem('system_operate_status', detailData.status)?.listClass || 'info'"
            effect="plain"
            size="small"
          >
            {{ getDictItem('system_operate_status', detailData.status)?.value || detailData.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">{{ detailData.operateDesc }}</el-descriptions-item>
        <el-descriptions-item label="请求地址" :span="2">{{ detailData.requestUrl }}</el-descriptions-item>
        <el-descriptions-item label="方法名称" :span="2">{{ detailData.method }}</el-descriptions-item>
        <el-descriptions-item label="操作IP">{{ detailData.operateIp }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailData.costTime }}ms</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <el-input
            v-if="detailData.requestParam"
            type="textarea"
            :model-value="detailData.requestParam"
            readonly
            :autosize="{ minRows: 2, maxRows: 6 }"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="返回结果" :span="2">
          <el-input
            v-if="detailData.responseResult"
            type="textarea"
            :model-value="detailData.responseResult"
            readonly
            :autosize="{ minRows: 2, maxRows: 6 }"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.errorMsg" label="错误信息" :span="2">
          <el-input
            type="textarea"
            :model-value="detailData.errorMsg"
            readonly
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">{{ detailData.createTime }}</el-descriptions-item>
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
import { operateLogPage, removeOperateLogByIds, cleanOperateLog } from './apis'
import type { SystemOperateLogQueryVO, SystemOperateLogVO } from './apis/type'

defineOptions({
  name: 'operateLog',
})

const { getDictList, getDictItem } = useDict(['system_operate_type', 'system_operate_status'])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemOperateLogQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<SystemOperateLogVO[]>([])

const detailVisible = ref(false)
const detailData = ref<SystemOperateLogVO>({})

function handleSearch() {
  paginationData.currentPage = 1
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  paginationData.currentPage = 1
  getTableData()
}

function handleDetail(row: SystemOperateLogVO) {
  detailData.value = row
  detailVisible.value = true
}

function handleRemove(row: SystemOperateLogVO) {
  ElMessageBox.confirm(`确认删除该条操作日志？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    if (row.id) {
      removeOperateLogByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || '删除成功')
        getTableData()
      })
    }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemOperateLogVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.length} 条操作日志？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeOperateLogByIds(ids).then((data) => {
      ElMessage.success(data.msg || '删除成功')
      getTableData()
    })
  })
}

function handleClean() {
  ElMessageBox.confirm('确认清空所有操作日志？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error',
  }).then(() => {
    cleanOperateLog().then(() => {
      ElMessage.success('清空成功')
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
  operateLogPage(params)
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
