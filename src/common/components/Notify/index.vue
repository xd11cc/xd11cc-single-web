<template>
  <div class="notify">
    <el-popover placement="bottom" :width="popoverWidth" trigger="click" @show="handlePopoverShow">
      <template #reference>
        <el-badge :value="totalUnread" :max="badgeMax" :hidden="totalUnread === 0">
          <el-tooltip effect="dark" :content="t('layout.notify.tooltip')" placement="bottom">
            <button type="button" class="notify-trigger" :aria-label="t('layout.notify.open')">
              <Icon
                icon="lucide:bell"
                width="18"
                height="18"
                class="notify-icon"
                aria-hidden="true"
              />
            </button>
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
                <button
                  v-for="notice in item.list"
                  :key="notice.id"
                  type="button"
                  class="notify-item"
                  :class="{ unread: notice.readStatus === 0 }"
                  @click="handleRead(notice)"
                >
                  <span class="notify-item-content">
                    <span class="title">{{ notice.title }}</span>
                    <span v-if="notice.content" class="description">{{ notice.content }}</span>
                    <span class="time">{{ notice.senderName }} · {{ notice.publishTime }}</span>
                  </span>
                  <el-tag v-if="notice.readStatus === 0" type="danger" size="small" effect="plain">
                    {{ t('system.noticeUser.readStatus.unread') }}
                  </el-tag>
                </button>
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

    <!-- 待办提醒：队列化单例弹窗，同一时间只展示一条 -->
    <TodoPopup />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useWebSocket } from '@@/composables/useWebSocket'
import { useTodoQueue } from '@@/composables/useTodoQueue'
import { openApprovalTodo, openNoticeCenter } from '@@/utils/notice-navigation'
import { useSettingsStore } from '@/pinia/stores/settings'
import type { NoticeWebSocketDTO } from '@@/utils/webSocket'
import {
  myNoticePage,
  markAsRead,
  markAllAsRead,
  unreadCount,
} from '@/views/system/noticeUser/apis'
import type { SystemNoticeUserDTO } from '@/views/system/noticeUser/apis/type'
import { useI18n } from 'vue-i18n'
import TodoPopup from './TodoPopup.vue'

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
const settingsStore = useSettingsStore()
const todoQueue = useTodoQueue()

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
  openNoticeCenter(router)
}

/**
 * 点击通知卡片后的跳转：优先使用后端下发的业务信息，缺失时退回消息中心。
 */
function openNotice(notice: NoticeWebSocketDTO) {
  if (notice.processInstanceId || notice.taskId) {
    openApprovalTodo(router, {
      processInstanceId: notice.processInstanceId,
      taskId: notice.taskId,
    })
    return
  }
  openNoticeCenter(router)
}

/**
 * 消息（type=2）：带摘要和“查看详情”入口的富内容通知，悬停暂停计时。
 */
function showMessageNotice(notice: NoticeWebSocketDTO) {
  const content = notice.content?.trim()
  ElNotification({
    title: t('layout.notify.tabs.message'),
    dangerouslyUseHTMLString: true,
    message: `
      <div class="notify-message">
        <div class="notify-message__title">${escapeHtml(notice.title || '')}</div>
        ${content ? `<div class="notify-message__desc">${escapeHtml(content)}</div>` : ''}
        <div class="notify-message__action">${escapeHtml(t('layout.notify.actionView'))}</div>
      </div>
    `,
    type: 'success',
    duration: 6000,
    position: 'top-right',
    customClass: 'notify-message-notice',
    onClick: () => openNotice(notice),
  })
}

/**
 * 通知（type=1）：轻量提示，4 秒自动消失，点击定位到消息中心。
 */
function showInfoNotice(notice: NoticeWebSocketDTO) {
  ElNotification({
    title: t('layout.notify.tabs.notice'),
    message: `${notice.senderName ? notice.senderName + '：' : ''}${notice.title}`,
    type: 'info',
    duration: 4000,
    position: 'top-right',
    onClick: () => openNotice(notice),
  })
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function onNewNotice(data: NoticeWebSocketDTO) {
  fetchUnreadCount()
  if (!data?.type) return
  fetchNoticeList(data.type)

  switch (data.type) {
    // 待办：走队列化单例弹窗，避免连续弹窗互相打断
    case 3:
      if (!settingsStore.todoPopup) break
      todoQueue.push(data)
      break
    // 消息：富内容通知 + 查看详情
    case 2:
      showMessageNotice(data)
      break
    // 通知：轻量提示
    case 1:
    default:
      if (data.title) showInfoNotice(data)
      break
  }
}

function onRevokeNotice() {
  fetchUnreadCount()
  tabList.value.forEach((tab) => fetchNoticeList(tab.type))
}

// 用户结束输入（失焦/回车）时，补弹此前因忙碌而被推迟的待办。
// 监听器在文档级捕获，内部由 pendingAfterBusy 短路，无待补弹时不产生额外开销。
function onGlobalInteractionEnd() {
  todoQueue.flushIfIdle()
}

fetchUnreadCount()

on('NEW_NOTICE', onNewNotice)
on('REVOKE_NOTICE', onRevokeNotice)
document.addEventListener('focusout', onGlobalInteractionEnd, true)
document.addEventListener('keydown', onGlobalInteractionEnd, true)

onUnmounted(() => {
  off('NEW_NOTICE', onNewNotice)
  off('REVOKE_NOTICE', onRevokeNotice)
  document.removeEventListener('focusout', onGlobalInteractionEnd, true)
  document.removeEventListener('keydown', onGlobalInteractionEnd, true)
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

  .notify-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: none;
    font-family: inherit;
    cursor: pointer;
  }

  .notify-icon {
    color: var(--theme-text-secondary);
    transition: color var(--p-duration-fast);
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
    gap: var(--p-space-3);
    width: 100%;
    padding: var(--p-space-3) var(--p-space-2);
    border: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: none;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition: background-color var(--p-duration-normal);

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
    gap: var(--p-space-1);

    .title {
      font-size: var(--p-text-base);
      color: var(--el-text-color-primary);
      line-height: 1.4;
    }

    .description {
      font-size: var(--p-text-sm);
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .time {
      font-size: var(--p-text-sm);
      color: var(--el-text-color-placeholder);
    }
  }
}

.notify-footer {
  display: flex;
  justify-content: space-between;
  padding-top: var(--p-space-3);
  border-top: 1px solid var(--el-border-color);
}
</style>
