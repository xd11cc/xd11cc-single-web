<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="title" :label="$t('system.noticeUser.search.title')">
          <el-input
            v-model="searchData.title"
            :placeholder="$t('system.noticeUser.formPlaceholder.title')"
          />
        </el-form-item>
        <el-form-item prop="type" :label="$t('system.noticeUser.search.type')">
          <el-select
            v-model="searchData.type"
            :placeholder="$t('system.noticeUser.formPlaceholder.type')"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="item in getDictList('system_notice_type')"
              :key="item.id"
              :label="item.value"
              :value="Number(item.label)"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="readStatus" :label="$t('system.noticeUser.search.readStatus')">
          <el-select
            v-model="searchData.readStatus"
            :placeholder="$t('system.noticeUser.formPlaceholder.readStatus')"
            clearable
            style="width: 130px"
          >
            <el-option :value="0" :label="$t('system.noticeUser.readStatus.unread')" />
            <el-option :value="1" :label="$t('system.noticeUser.readStatus.read')" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template>{{ $t('common.search') }}
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>{{ $t('common.reset') }}
          </el-button>
          <el-button type="success" @click="handleMarkAllAsRead">
            <template #icon><Icon icon="lucide:check-check" /></template
            >{{ $t('common.messages.markAllRead') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="table-wrapper">
        <el-table :data="tableData" @row-click="handleRowClick">
          <el-table-column
            type="index"
            :label="$t('system.noticeUser.columns.index')"
            width="60"
            align="center"
          />
          <el-table-column
            prop="title"
            :label="$t('system.noticeUser.columns.title')"
            min-width="200"
          >
            <template #default="scope">
              <span :class="{ 'unread-title': scope.row.readStatus === 0 }">
                {{ scope.row.title }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="type"
            :label="$t('system.noticeUser.columns.type')"
            align="center"
            width="100"
          >
            <template #default="scope">
              <el-tag
                :type="
                  getDictItem('system_notice_type', String(scope.row.type))?.listClass || 'info'
                "
                effect="plain"
                size="small"
                disable-transitions
              >
                {{ getDictItem('system_notice_type', String(scope.row.type))?.value }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="senderName"
            :label="$t('system.noticeUser.columns.senderName')"
            align="center"
            width="120"
          />
          <el-table-column
            prop="readStatus"
            :label="$t('system.noticeUser.columns.readStatus')"
            align="center"
            width="80"
          >
            <template #default="scope">
              <el-tag
                :type="scope.row.readStatus === 1 ? 'success' : 'danger'"
                size="small"
                effect="plain"
              >
                {{
                  scope.row.readStatus === 1
                    ? $t('system.noticeUser.readStatus.read')
                    : $t('system.noticeUser.readStatus.unread')
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="publishTime"
            :label="$t('system.noticeUser.columns.publishTime')"
            align="center"
            min-width="160"
          />
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
    <el-dialog v-model="detailVisible" :title="$t('system.noticeUser.dialogs.detail')" width="50%">
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="$t('system.noticeUser.search.title')" :span="2">{{
          detailData.title
        }}</el-descriptions-item>
        <el-descriptions-item :label="$t('system.noticeUser.search.type')">
          {{ getDictItem('system_notice_type', String(detailData.type))?.value }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('system.noticeUser.columns.senderName')">{{
          detailData.senderName || '-'
        }}</el-descriptions-item>
        <el-descriptions-item :label="$t('system.noticeUser.columns.publishTime')">{{
          detailData.publishTime || '-'
        }}</el-descriptions-item>
        <el-descriptions-item :label="$t('system.noticeUser.columns.readTime')">{{
          detailData.readTime || '-'
        }}</el-descriptions-item>
        <el-descriptions-item :label="$t('system.noticeUser.columns.content')" :span="2">
          <div style="white-space: pre-wrap">{{ detailData.content || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { usePagination } from '@@/composables/usePagination'
import { myNoticePage, markAsRead, markAllAsRead } from './apis'
import type { SystemNoticeUserDTO, SystemNoticeUserQueryVO } from './apis/type'

const { t } = useI18n()
const $t = t

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
    ElMessage.success(res.msg || $t('common.messages.operationSuccess'))
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
