<template>
  <div class="notify">
    <el-popover placement="bottom" :width="popoverWidth" trigger="click" @show="handlePopoverShow">
      <template #reference>
        <el-badge :value="totalUnread" :max="badgeMax" :hidden="totalUnread === 0">
          <el-tooltip effect="dark" :content="t('layout.notify.tooltip')" placement="bottom">
            <Icon icon="lucide:bell" width="18" height="18" class="notify-icon" />
          </el-tooltip>
        </el-badge>
      </template>
      <template #default>
        <el-tabs v-model="activeName" class="notify-tabs" stretch>
          <el-tab-pane v-for="item in tabList" :key="item.type" :name="item.name">
            <template #label>
              {{ t(item.labelKey) }}
              <el-badge :value="item.unread" :max="badgeMax" :type="item.badgeType" />
            </template>
            <el-scrollbar height="360px">
              <div class="notify-list">
                <div
                  v-for="notice in item.list"
                  :key="notice.id"
                  class="notify-item"
                  :class="{ unread: notice.readStatus === 0 }"
                  @click="handleRead(notice)"
                >
                  <div class="notify-item-content">
                    <span class="title">{{ notice.title }}</span>
                    <span v-if="notice.content" class="description">{{ notice.content }}</span>
                    <span class="time">{{ notice.senderName }} · {{ notice.publishTime }}</span>
                  </div>
                  <el-tag v-if="notice.readStatus === 0" type="danger" size="small" effect="plain">
                    {{ t('system.noticeUser.readStatus.unread') }}
                  </el-tag>
                </div>
                <el-empty
                  v-if="!item.list.length"
                  :description="t('common.messages.noData')"
                  :image-size="60"
                />
              </div>
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
        <div class="notify-footer">
          <el-button link @click="handleMarkAllRead">{{
            t('common.messages.markAllRead')
          }}</el-button>
          <el-button link @click="handleHistory">{{ t('common.messages.viewMore') }}</el-button>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useWebSocket } from '@@/composables/useWebSocket'
import {
  myNoticePage,
  markAsRead,
  markAllAsRead,
  unreadCount,
} from '@/views/system/noticeUser/apis'
import type { SystemNoticeUserDTO } from '@/views/system/noticeUser/apis/type'
import { useI18n } from 'vue-i18n'

type TabName = 'notice' | 'message' | 'todo'

interface TabItem {
  name: TabName
  labelKey: string
  type: number
  badgeType: 'primary' | 'danger' | 'warning'
  unread: number
  list: SystemNoticeUserDTO[]
}

const router = useRouter()
const { on, off } = useWebSocket()
const { t } = useI18n()

const badgeMax = 99
const popoverWidth = 360

const activeName = ref<TabName>('notice')

const tabList = ref<TabItem[]>([
  {
    name: 'notice',
    labelKey: 'layout.notify.tabs.notice',
    type: 1,
    badgeType: 'primary',
    unread: 0,
    list: [],
  },
  {
    name: 'message',
    labelKey: 'layout.notify.tabs.message',
    type: 2,
    badgeType: 'danger',
    unread: 0,
    list: [],
  },
  {
    name: 'todo',
    labelKey: 'layout.notify.tabs.todo',
    type: 3,
    badgeType: 'warning',
    unread: 0,
    list: [],
  },
])

const totalUnread = computed(() => tabList.value.reduce((sum, item) => sum + item.unread, 0))

function fetchUnreadCount() {
  unreadCount().then(({ data }) => {
    tabList.value[0].unread = data['notice'] || 0
    tabList.value[1].unread = data['message'] || 0
    tabList.value[2].unread = data['todo'] || 0
  })
}

function fetchNoticeList(type: number) {
  const tab = tabList.value.find((t) => t.type === type)
  if (!tab) return
  myNoticePage({ type, currentPage: 1, pageSize: 20 }).then(({ data }) => {
    tab.list = data.rows
  })
}

function handlePopoverShow() {
  fetchUnreadCount()
  tabList.value.forEach((tab) => fetchNoticeList(tab.type))
}

function handleRead(notice: SystemNoticeUserDTO) {
  if (notice.readStatus === 0 && notice.noticeId) {
    markAsRead(notice.noticeId).then(() => {
      notice.readStatus = 1
      const tab = tabList.value.find((t) => t.type === notice.type)
      if (tab && tab.unread > 0) tab.unread--
    })
  }
}

function handleMarkAllRead() {
  const tab = tabList.value.find((t) => t.name === activeName.value)
  if (!tab) return
  markAllAsRead(tab.type).then(() => {
    tab.unread = 0
    tab.list.forEach((item) => (item.readStatus = 1))
  })
}

function handleHistory() {
  router.push({ name: 'noticeUser' })
}

const noticeTypeMap: Record<number, { titleKey: string; type: 'info' | 'success' | 'warning' }> = {
  1: { titleKey: 'layout.notify.tabs.notice', type: 'info' },
  2: { titleKey: 'layout.notify.tabs.message', type: 'success' },
  3: { titleKey: 'layout.notify.tabs.todo', type: 'warning' },
}

function onNewNotice(data: any) {
  fetchUnreadCount()
  if (data?.type) {
    fetchNoticeList(data.type)
  }
  if (data?.title) {
    const meta = noticeTypeMap[data.type]
    ElNotification({
      title: meta ? t(meta.titleKey) : t('layout.notify.fallbackTitle'),
      message: `${data.senderName ? data.senderName + '：' : ''}${data.title}`,
      type: meta?.type || 'info',
      duration: 4000,
    })
  }
}

function onRevokeNotice() {
  fetchUnreadCount()
  tabList.value.forEach((tab) => fetchNoticeList(tab.type))
}

fetchUnreadCount()

on('NEW_NOTICE', onNewNotice)
on('REVOKE_NOTICE', onRevokeNotice)

onUnmounted(() => {
  off('NEW_NOTICE', onNewNotice)
  off('REVOKE_NOTICE', onRevokeNotice)
})
</script>

<style lang="scss" scoped>
.notify {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  :deep(.el-badge) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :deep(svg) {
    outline: none;
  }

  .notify-icon {
    color: var(--theme-text-secondary);
    transition: color var(--p-duration-fast);
    cursor: pointer;
  }
}

.notify-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
}

.notify-list {
  .notify-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    &:last-child {
      border-bottom: none;
    }

    &.unread .title {
      font-weight: 600;
    }
  }

  .notify-item-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .title {
      font-size: 13px;
      color: var(--el-text-color-primary);
      line-height: 1.4;
    }

    .description {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .time {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
}

.notify-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color);
}
</style>
