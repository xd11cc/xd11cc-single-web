<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="username" label="登录账号">
          <el-input v-model="searchData.username" placeholder="请输入登录账号" />
        </el-form-item>
        <el-form-item prop="loginType" label="登录类型">
          <el-select
            v-model="searchData.loginType"
            placeholder="登录类型"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in getDictList('system_login_type')"
              :key="item.id"
              :label="item.value"
              :value="item.label!"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select
            v-model="searchData.status"
            placeholder="登录状态"
            clearable
            style="width: 150px"
          >
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
            v-permission="['system:loginLog:delete']"
          >
            <template #icon><Icon icon="lucide:trash-2" /></template>
            批量删除
          </el-button>
          <el-button
            type="danger"
            plain
            @click="handleClean"
            v-permission="['system:loginLog:clean']"
          >
            <template #icon><Icon icon="lucide:trash" /></template>
            清空
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="username" label="登录账号" align="center" />
          <el-table-column prop="loginType" label="登录类型" align="center" width="100">
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_login_type', scope.row.loginType)?.listClass || 'info'"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{
                  getDictItem('system_login_type', scope.row.loginType)?.value ||
                  scope.row.loginType
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" align="center" width="80">
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_operate_status', scope.row.status)?.listClass || 'info'"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{
                  getDictItem('system_operate_status', scope.row.status)?.value || scope.row.status
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="loginIp" label="登录IP" align="center" width="140" />
          <el-table-column prop="browser" label="浏览器" align="center" />
          <el-table-column prop="os" label="操作系统" align="center" />
          <el-table-column prop="msg" label="提示信息" align="center" />
          <el-table-column prop="loginTime" label="登录时间" align="center" min-width="160" />
          <el-table-column fixed="right" label="操作" width="80" align="center">
            <template #default="scope">
              <el-button
                type="danger"
                text
                bg
                size="small"
                @click="handleRemove(scope.row)"
                v-permission="['system:loginLog:delete']"
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
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { usePagination } from '@@/composables/usePagination'
import { loginLogPage, removeLoginLogByIds, cleanLoginLog } from './apis'
import type { SystemLoginLogQueryVO, SystemLoginLogVO } from './apis/type'

defineOptions({
  name: 'loginLog',
})

const { getDictList, getDictItem } = useDict(['system_login_type', 'system_operate_status'])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemLoginLogQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<SystemLoginLogVO[]>([])

function handleSearch() {
  paginationData.currentPage = 1
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  paginationData.currentPage = 1
  getTableData()
}

function handleRemove(row: SystemLoginLogVO) {
  ElMessageBox.confirm('确认删除该条登录日志？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    if (row.id) {
      removeLoginLogByIds(String(row.id)).then((data) => {
        ElMessage.success(data.msg || '删除成功')
        getTableData()
      })
    }
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemLoginLogVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.length} 条登录日志？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeLoginLogByIds(ids).then((data) => {
      ElMessage.success(data.msg || '删除成功')
      getTableData()
    })
  })
}

function handleClean() {
  ElMessageBox.confirm('确认清空所有登录日志？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error',
  }).then(() => {
    cleanLoginLog().then(() => {
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
  loginLogPage(params)
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
