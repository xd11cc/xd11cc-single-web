<template>
  <UseCrudView :slotProps="crud.slotProps" readonly @row-click="handleRowClick">
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
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
          class="search-field-sm"
        >
          <el-option
            v-for="item in getDictList('system_notice_type')"
            :key="item.id"
            :label="String(item.value)"
            :value="String(item.label)"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="readStatus" :label="$t('system.noticeUser.search.readStatus')">
        <el-select
          v-model="searchData.readStatus"
          :placeholder="$t('system.noticeUser.formPlaceholder.readStatus')"
          clearable
          class="search-field-sm"
        >
          <el-option
            v-for="item in getDictList('system_read_status')"
            :key="item.id"
            :label="String(item.value)"
            :value="String(item.label)"
          />
        </el-select>
      </el-form-item>
    </template>

    <!-- 工具栏：全部已读（从搜索区按钮组移到这里，与其它页面一致） -->
    <template #actions>
      <el-button type="success" @click="handleMarkAllAsRead">
        <template #icon><Icon icon="lucide:check-check" /></template>
        {{ $t('common.messages.markAllRead') }}
      </el-button>
    </template>

    <!-- 表格列 -->
    <template #table>
      <el-table-column
        type="index"
        :label="$t('system.noticeUser.columns.index')"
        width="60"
        align="center"
      />
      <el-table-column prop="title" :label="$t('system.noticeUser.columns.title')" min-width="200">
        <template #default="scope">
          <span :class="{ 'unread-title': scope.row.readStatus === READ_STATUS.UNREAD }">
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
            :type="getDictItem('system_notice_type', String(scope.row.type))?.listClass || 'info'"
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
            :type="
              getDictItem('system_read_status', String(scope.row.readStatus))?.listClass || 'info'
            "
            size="small"
            effect="plain"
          >
            {{
              getDictItem('system_read_status', String(scope.row.readStatus))?.value ||
              scope.row.readStatus
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
    </template>

    <!-- 页面自有弹窗 / 抽屉：放进 #extra，保证壳只有一个根节点 -->
    <template #extra>
      <!-- 详情弹窗：放在壳的同一级 -->
      <el-dialog
        v-model="detailVisible"
        :title="$t('system.noticeUser.dialogs.detail')"
        width="50%"
      >
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
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { useDict } from '@/common/composables/useDict'
import { myNoticePage, markAsRead, markAllAsRead } from './apis'
import type { SystemNoticeUserQueryVO, SystemNoticeUserDTO } from './apis/type'

const { t } = useI18n()
const $t = t

/** 已读状态（char(2)，必须字符串比较） */
/** 已读状态编码：仅用于行为判断（未读高亮、标记已读），展示文案走字典 */
const READ_STATUS = {
  UNREAD: '0',
  READ: '1',
} as const

defineOptions({
  name: 'noticeUser',
})

const { getDictList, getDictItem } = useDict(['system_notice_type', 'system_read_status'])

// 只读列表：站内消息，无新增/编辑
const crud = useCrud<SystemNoticeUserQueryVO, SystemNoticeUserDTO>({
  pageApi: (query) => myNoticePage(query),
})

const detailVisible = ref(false)
const detailData = ref<SystemNoticeUserDTO>({})

function handleRowClick(row: SystemNoticeUserDTO) {
  detailData.value = row
  detailVisible.value = true
  if (row.readStatus === READ_STATUS.UNREAD && row.noticeId) {
    markAsRead(row.noticeId).then(() => {
      row.readStatus = READ_STATUS.READ
    })
  }
}

function handleMarkAllAsRead() {
  markAllAsRead(crud.slotProps.searchData.type).then((res) => {
    ElMessage.success(res.msg || $t('common.messages.operationSuccess'))
    crud.refresh()
  })
}
</script>

<style lang="scss" scoped>
.unread-title {
  font-weight: 600;
}
</style>
