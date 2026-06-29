<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="title" label="标题">
          <el-input v-model="searchData.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item prop="type" label="类型">
          <el-select v-model="searchData.type" placeholder="通知类型" clearable style="width: 130px">
            <el-option
              v-for="item in getDictList('system_notice_type')"
              :key="item.id"
              :label="item.value"
              :value="Number(item.label)"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="readStatus" label="状态">
          <el-select v-model="searchData.readStatus" placeholder="读取状态" clearable style="width: 130px">
            <el-option :value="0" label="未读" />
            <el-option :value="1" label="已读" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template>查询
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>重置
          </el-button>
          <el-button type="success" @click="handleMarkAllAsRead">
            <template #icon><Icon icon="lucide:check-check" /></template>全部已读
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="table-wrapper">
        <el-table :data="tableData" @row-click="handleRowClick">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="title" label="标题" min-width="200">
            <template #default="scope">
              <span :class="{ 'unread-title': scope.row.readStatus === 0 }">
                {{ scope.row.title }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" align="center" width="100">
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_notice_type', String(scope.row.type))?.listClass || 'info'"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{ getDictItem('system_notice_type', String(scope.row.type))?.value }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="senderName" label="发送人" align="center" width="120" />
          <el-table-column prop="readStatus" label="状态" align="center" width="80">
            <template #default="scope">
              <el-tag :type="scope.row.readStatus === 1 ? 'success' : 'danger'" size="small" effect="plain">
                {{ scope.row.readStatus === 1 ? '已读' : '未读' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="publishTime" label="发布时间" align="center" min-width="160" />
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
    <el-dialog v-model="detailVisible" title="通知详情" width="50%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标题" :span="2">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          {{ getDictItem('system_notice_type', String(detailData.type))?.value }}
        </el-descriptions-item>
        <el-descriptions-item label="发送人">{{ detailData.senderName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ detailData.publishTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="阅读时间">{{ detailData.readTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="内容" :span="2">
          <div style="white-space: pre-wrap">{{ detailData.content || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { usePagination } from '@@/composables/usePagination'
import { myNoticePage, markAsRead, markAllAsRead } from './apis'
import type { SystemNoticeUserDTO, SystemNoticeUserQueryVO } from './apis/type'

defineOptions({
  name: 'noticeUser',
})

const { getDictList, getDictItem } = useDict(['system_notice_type'])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const detailVisible = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemNoticeUserQueryVO>({})

const tableData = ref<SystemNoticeUserDTO[]>([])
const detailData = ref<SystemNoticeUserDTO>({})

function handleSearch() {
  paginationData.currentPage = 1
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  paginationData.currentPage = 1
  getTableData()
}

function handleRowClick(row: SystemNoticeUserDTO) {
  detailData.value = row
  detailVisible.value = true
  if (row.readStatus === 0 && row.noticeId) {
    markAsRead(row.noticeId).then(() => {
      row.readStatus = 1
    })
  }
}

function handleMarkAllAsRead() {
  markAllAsRead(searchData.type).then((res) => {
    ElMessage.success(res.msg || '操作成功')
    getTableData()
  })
}

function getTableData() {
  loading.value = true
  const params: SystemNoticeUserQueryVO = {
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  myNoticePage(params)
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

.table-wrapper {
  margin-bottom: 20px;
}

.page-wrapper {
  display: flex;
  justify-content: flex-end;
}

.unread-title {
  font-weight: 600;
}
</style>
