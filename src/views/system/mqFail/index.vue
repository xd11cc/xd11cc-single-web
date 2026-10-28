<template>
  <UseCrudView :slotProps="crud.slotProps" readonly>
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
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
    </template>

    <!-- 表格列 -->
    <template #table>
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
              :disabled="scope.row.status !== STATUS_PENDING"
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
              :disabled="scope.row.status !== STATUS_PENDING"
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
              :disabled="scope.row.status !== STATUS_PENDING"
              @click="handleIgnore(scope.row)"
              v-permission="['system:mqFail:ignore']"
            >
              <Icon icon="lucide:ban" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </template>

    <!-- 页面自有弹窗 / 抽屉：放进 #extra，保证壳只有一个根节点 -->
    <template #extra>
      <!-- 重投 / 详情弹窗：不属于新增/编辑，放在壳的同一级 -->
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
            v-if="detailData.status === '1' && detailData.updateTime"
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
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { useDict } from '@/common/composables/useDict'
import { mqFailPage, replayMqFail, replayEditMqFail, ignoreMqFail } from './apis'
import type { SystemMqFailQueryVO, SystemMqFailVO } from './apis/type'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'mqFail',
})

// 只读列表：失败消息只能重投/忽略，没有新增/编辑整条记录
const crud = useCrud<SystemMqFailQueryVO, SystemMqFailVO>({
  pageApi: (query) => mqFailPage(query),
})

const detailVisible = ref(false)
const detailData = ref<SystemMqFailVO>({})

const editVisible = ref(false)
const editSubmitting = ref(false)
const editDataError = ref('')
const editData = reactive<SystemMqFailVO>({})

// 状态文案与标签色统一由字典 mq_fail_status 提供，避免与后端字典分叉
const { getDictList, getDictItem } = useDict(['mq_fail_status'])

/**
 * 仅有「待处理」允许重投/忽略。
 * <p>这是<b>行为判断</b>，依赖具体状态码，保留常量；
 * 展示文案一律走字典，不再 i18n 硬编码。</p>
 */
const STATUS_PENDING = '0'

/** 状态下拉选项：label 存编码、value 存文案 */
const statusOptions = computed(() =>
  getDictList('mq_fail_status').map((item) => ({
    value: String(item.label),
    label: String(item.value),
  })),
)

function statusLabel(status?: string) {
  if (status === undefined || status === null || status === '') return '-'
  return getDictItem('mq_fail_status', status)?.value ?? status
}

function statusTagType(status?: string) {
  return getDictItem('mq_fail_status', status ?? '')?.listClass ?? 'info'
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
      crud.refresh()
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
      crud.refresh()
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
      crud.refresh()
    })
  })
}
</script>
