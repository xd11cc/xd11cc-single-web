<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="messageId" :label="$t('system.mqFail.search.messageId')">
          <el-input
            v-model="searchData.messageId"
            :placeholder="$t('system.mqFail.formPlaceholder.messageId')"
            clearable
          />
        </el-form-item>
        <el-form-item prop="queueName" :label="$t('system.mqFail.search.queueName')">
          <el-input
            v-model="searchData.queueName"
            :placeholder="$t('system.mqFail.formPlaceholder.queueName')"
            clearable
            class="search-field-lg"
          />
        </el-form-item>
        <el-form-item prop="status" :label="$t('system.mqFail.search.status')">
          <el-select
            v-model="searchData.status"
            :placeholder="$t('system.mqFail.formPlaceholder.status')"
            clearable
            class="search-field"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template
            >{{ $t('system.mqFail.actions.query') }}
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>{{ $t('common.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="table-wrapper">
        <el-table :data="tableData">
          <el-table-column
            prop="messageId"
            :label="$t('system.mqFail.columns.messageId')"
            min-width="260"
            show-overflow-tooltip
          />
          <el-table-column
            prop="queueName"
            :label="$t('system.mqFail.columns.queueName')"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            prop="retryCount"
            :label="$t('system.mqFail.columns.retryCount')"
            align="right"
            width="100"
          />
          <el-table-column
            prop="status"
            :label="$t('system.mqFail.columns.status')"
            align="center"
            width="100"
          >
            <template #default="scope">
              <el-tag
                :type="statusTagType(scope.row.status)"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{ statusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="createTime"
            :label="$t('system.mqFail.columns.createTime')"
            align="center"
            width="170"
          />
          <el-table-column fixed="right" :label="$t('common.action')" width="180" align="center">
            <template #default="scope">
              <el-tooltip :content="$t('system.mqFail.actions.detail')" placement="top">
                <el-button type="primary" text bg size="small" @click="handleDetail(scope.row)">
                  <Icon icon="lucide:eye" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.mqFail.actions.replay')" placement="top">
                <el-button
                  type="warning"
                  text
                  bg
                  size="small"
                  :disabled="scope.row.status !== 0"
                  @click="handleReplay(scope.row)"
                  v-permission="['system:mqFail:replay']"
                >
                  <Icon icon="lucide:refresh-cw" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.mqFail.actions.replayEdit')" placement="top">
                <el-button
                  type="primary"
                  text
                  bg
                  size="small"
                  :disabled="scope.row.status !== 0"
                  @click="handleReplayEdit(scope.row)"
                  v-permission="['system:mqFail:replay']"
                >
                  <Icon icon="lucide:pencil" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.mqFail.actions.ignore')" placement="top">
                <el-button
                  type="danger"
                  text
                  bg
                  size="small"
                  :disabled="scope.row.status !== 0"
                  @click="handleIgnore(scope.row)"
                  v-permission="['system:mqFail:ignore']"
                >
                  <Icon icon="lucide:ban" />
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

    <!-- 编辑重投弹窗 -->
    <el-dialog
      v-model="editVisible"
      :title="$t('system.mqFail.dialogs.replayEdit')"
      width="60%"
      @closed="resetEdit"
    >
      <el-alert
        :title="$t('system.mqFail.messages.editTip')"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      />
      <el-form label-position="top">
        <el-form-item :label="$t('system.mqFail.detail.messageId')">
          <el-input :model-value="editData.messageId" disabled />
        </el-form-item>
        <el-form-item :label="$t('system.mqFail.detail.queueName')">
          <el-input :model-value="editData.queueName" disabled />
        </el-form-item>
        <el-form-item :label="$t('system.mqFail.detail.data')">
          <el-input
            v-model="editData.data"
            type="textarea"
            :rows="12"
            :placeholder="$t('system.mqFail.formPlaceholder.data')"
          />
        </el-form-item>
        <el-form-item>
          <el-button size="small" @click="formatEditData">
            <template #icon><Icon icon="lucide:wand-sparkles" /></template>
            {{ $t('system.mqFail.actions.format') }}
          </el-button>
          <el-text v-if="editDataError" type="danger" size="small">{{ editDataError }}</el-text>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="submitReplayEdit">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="$t('system.mqFail.dialogs.detail')" width="60%">
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="$t('system.mqFail.detail.messageId')" :span="2">
          {{ detailData.messageId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('system.mqFail.detail.queueName')">
          {{ detailData.queueName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('system.mqFail.detail.retryCount')">
          {{ detailData.retryCount ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('system.mqFail.detail.status')">
          <el-tag :type="statusTagType(detailData.status)" effect="plain" size="small">
            {{ statusLabel(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('system.mqFail.detail.createTime')">
          {{ detailData.createTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('system.mqFail.detail.errorMsg')" :span="2">
          <el-input
            v-if="detailData.errorMsg"
            type="textarea"
            :model-value="detailData.errorMsg"
            readonly
            :autosize="{ minRows: 2, maxRows: 6 }"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('system.mqFail.detail.data')" :span="2">
          <el-input
            v-if="detailData.data"
            type="textarea"
            :model-value="prettyJson(detailData.data)"
            readonly
            :autosize="{ minRows: 4, maxRows: 14 }"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="detailData.status === 1 && detailData.updateTime"
          :label="$t('system.mqFail.detail.replayTime')"
          :span="2"
        >
          {{ detailData.updateTime }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">{{ $t('common.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { usePagination } from '@@/composables/usePagination'
import { mqFailPage, replayMqFail, replayEditMqFail, ignoreMqFail } from './apis'
import type { SystemMqFailQueryVO, SystemMqFailVO } from './apis/type'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'mqFail',
})

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemMqFailQueryVO>({})

const tableData = ref<SystemMqFailVO[]>([])

const detailVisible = ref(false)
const detailData = ref<SystemMqFailVO>({})

const editVisible = ref(false)
const editSubmitting = ref(false)
const editDataError = ref('')
const editData = reactive<SystemMqFailVO>({})

/**
 * 状态字典：与后端 mq_fail_message.status 保持一致
 */
const statusOptions = computed(() => [
  { value: 0, label: $t('system.mqFail.status.pending') },
  { value: 1, label: $t('system.mqFail.status.replayed') },
  { value: 2, label: $t('system.mqFail.status.ignored') },
])

function statusLabel(status?: number) {
  if (status === 0) return $t('system.mqFail.status.pending')
  if (status === 1) return $t('system.mqFail.status.replayed')
  if (status === 2) return $t('system.mqFail.status.ignored')
  return '-'
}

function statusTagType(status?: number) {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'info'
  return 'info'
}

/**
 * 格式化原始消息 JSON，解析失败时原样返回
 */
function prettyJson(raw?: string) {
  if (!raw) return ''
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function handleSearch() {
  paginationData.currentPage = 1
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  delete searchData.messageId
  delete searchData.queueName
  delete searchData.status
  paginationData.currentPage = 1
  getTableData()
}

function handleDetail(row: SystemMqFailVO) {
  detailData.value = row
  detailVisible.value = true
}

function handleReplay(row: SystemMqFailVO) {
  ElMessageBox.confirm(
    $t('system.mqFail.messages.replayConfirm'),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    if (!row.id) return
    replayMqFail(row.id).then((data) => {
      ElMessage.success(data.msg || $t('system.mqFail.messages.replaySuccess'))
      getTableData()
    })
  })
}

function handleReplayEdit(row: SystemMqFailVO) {
  editData.id = row.id
  editData.messageId = row.messageId
  editData.queueName = row.queueName
  editData.data = prettyJson(row.data)
  editDataError.value = ''
  editVisible.value = true
}

/**
 * 校验并格式化编辑中的 JSON，便于人工核对
 */
function formatEditData() {
  const raw = (editData.data || '').trim()
  if (!raw) {
    editDataError.value = $t('system.mqFail.messages.dataEmpty')
    return
  }
  try {
    editData.data = JSON.stringify(JSON.parse(raw), null, 2)
    editDataError.value = ''
  } catch {
    editDataError.value = $t('system.mqFail.messages.dataInvalid')
  }
}

function resetEdit() {
  editData.id = undefined
  editData.messageId = undefined
  editData.queueName = undefined
  editData.data = ''
  editDataError.value = ''
  editSubmitting.value = false
}

function submitReplayEdit() {
  const raw = (editData.data || '').trim()
  if (!raw) {
    editDataError.value = $t('system.mqFail.messages.dataEmpty')
    return
  }
  try {
    JSON.parse(raw)
  } catch {
    editDataError.value = $t('system.mqFail.messages.dataInvalid')
    return
  }
  if (!editData.id) return

  editSubmitting.value = true
  replayEditMqFail(editData.id, raw)
    .then((data) => {
      ElMessage.success(data.msg || $t('system.mqFail.messages.replaySuccess'))
      editVisible.value = false
      getTableData()
    })
    .finally(() => {
      editSubmitting.value = false
    })
}

function handleIgnore(row: SystemMqFailVO) {
  ElMessageBox.confirm(
    $t('system.mqFail.messages.ignoreConfirm'),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    if (!row.id) return
    ignoreMqFail(row.id).then((data) => {
      ElMessage.success(data.msg || $t('system.mqFail.messages.ignoreSuccess'))
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
  mqFailPage(params)
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

onMounted(() => {
  getTableData()
})
</script>
