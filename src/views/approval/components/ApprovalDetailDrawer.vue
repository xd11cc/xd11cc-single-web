<template>
  <el-drawer
    v-model="visible"
    :size="drawerSize"
    class="approval-detail-drawer"
    destroy-on-close
    @closed="handleClosed"
  >
    <template #header>
      <div class="detail-header">
        <div class="detail-header__mark">
          <Icon icon="lucide:git-fork" />
        </div>
        <div class="detail-header__text">
          <h3>{{ detail?.title || $t('bpm.approval.detail.untitled') }}</h3>
          <div class="detail-header__meta">
            <span class="meta-chip">{{ detail?.processDefinitionKey || '-' }}</span>
            <span v-if="detail?.businessKey" class="meta-chip meta-chip--ghost">
              {{ detail.businessKey }}
            </span>
            <el-tag
              v-if="detail"
              :type="statusTagType(detail.status)"
              effect="dark"
              size="small"
              disable-transitions
            >
              {{ statusLabel(detail.status) }}
            </el-tag>
          </div>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="detail-body">
      <!-- 概览 -->
      <section class="detail-section">
        <div class="section-head">
          <span class="section-index">01</span>
          <span class="section-title">{{ $t('bpm.approval.detail.overview') }}</span>
        </div>
        <dl class="overview-grid">
          <div class="overview-item">
            <dt>{{ $t('bpm.approval.detail.starter') }}</dt>
            <dd>{{ detail?.starterUsername || '-' }}</dd>
          </div>
          <div class="overview-item">
            <dt>{{ $t('bpm.approval.detail.startTime') }}</dt>
            <dd>{{ detail?.createTime || '-' }}</dd>
          </div>
          <div class="overview-item">
            <dt>{{ $t('bpm.approval.detail.endTime') }}</dt>
            <dd>{{ detail?.endTime || '-' }}</dd>
          </div>
          <div class="overview-item">
            <dt>{{ $t('bpm.approval.detail.duration') }}</dt>
            <dd>{{ durationText }}</dd>
          </div>
        </dl>
      </section>

      <!-- 流程节点轨迹 -->
      <section class="detail-section">
        <div class="section-head">
          <span class="section-index">02</span>
          <span class="section-title">{{ $t('bpm.approval.detail.flow') }}</span>
          <span class="section-count">{{ flowNodes.length }}</span>
        </div>

        <div v-if="flowNodes.length" class="flow-track">
          <div
            v-for="(node, index) in flowNodes"
            :key="node.key"
            class="flow-node"
            :class="[`is-${node.state}`, { 'is-last': index === flowNodes.length - 1 }]"
          >
            <div class="flow-node__rail">
              <span class="flow-node__dot">
                <Icon :icon="node.icon" />
              </span>
              <span v-if="index !== flowNodes.length - 1" class="flow-node__line"></span>
            </div>
            <div class="flow-node__card">
              <div class="flow-node__top">
                <span class="flow-node__name">{{ node.name }}</span>
                <span class="flow-node__state">{{ node.stateLabel }}</span>
              </div>
              <div class="flow-node__meta">
                <span v-if="node.assignee">
                  <Icon icon="lucide:user-round" />{{ node.assignee }}
                </span>
                <span v-if="node.time">
                  <Icon icon="lucide:clock" />{{ node.time }}
                </span>
                <span v-if="node.duration">
                  <Icon icon="lucide:timer" />{{ node.duration }}
                </span>
              </div>
              <div v-if="node.comment" class="flow-node__comment">
                <Icon icon="lucide:message-square-quote" />
                <span>{{ node.comment }}</span>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else :description="$t('bpm.approval.detail.noFlow')" :image-size="80" />
      </section>

      <!-- 当前待处理 -->
      <section v-if="currentNodes.length" class="detail-section">
        <div class="section-head">
          <span class="section-index">03</span>
          <span class="section-title">{{ $t('bpm.approval.detail.pending') }}</span>
          <span class="section-count section-count--live">{{ currentNodes.length }}</span>
        </div>
        <div class="pending-list">
          <div v-for="task in currentNodes" :key="task.taskId" class="pending-item">
            <div class="pending-item__main">
              <span class="pending-item__name">{{ task.taskName }}</span>
              <span class="pending-item__assignee">
                <Icon icon="lucide:user-round" />
                {{ task.assignee || $t('bpm.approval.detail.candidate') }}
              </span>
            </div>
            <span class="pending-item__time">{{ task.createTime }}</span>
          </div>
        </div>
      </section>

      <!-- 审批操作区（仅我的审批页面传入 taskId 时显示） -->
      <section v-if="showActions" class="detail-section action-section">
        <div class="section-head">
          <span class="section-index">04</span>
          <span class="section-title">{{ $t('bpm.approval.detail.action') }}</span>
        </div>
        <el-form label-position="top" class="action-form">
          <el-form-item :label="$t('bpm.approval.form.comment')">
            <el-input
              v-model="actionForm.comment"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              :placeholder="$t('bpm.approval.placeholder.comment')"
            />
          </el-form-item>

          <!-- 驳回时选择目标节点 -->
          <el-form-item
            v-if="actionMode === 'reject'"
            :label="$t('bpm.approval.form.targetNode')"
            required
          >
            <el-select
              v-model="actionForm.targetActivityId"
              :loading="nodeLoading"
              :placeholder="$t('bpm.approval.placeholder.targetNode')"
              style="width: 100%"
            >
              <el-option
                v-for="node in rejectableNodes"
                :key="node.activityId"
                :label="nodeLabel(node)"
                :value="node.activityId!"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </section>
    </div>

    <template #footer>
      <div class="detail-footer">
        <el-button @click="visible = false">{{ $t('common.close') }}</el-button>
        <template v-if="showActions">
          <el-button
            v-if="actionMode !== 'reject'"
            type="danger"
            plain
            @click="switchToReject"
          >
            <template #icon><Icon icon="lucide:undo-2" /></template>
            {{ $t('bpm.approval.action.reject') }}
          </el-button>
          <el-button
            v-if="actionMode === 'reject'"
            @click="actionMode = 'approve'"
          >
            {{ $t('bpm.approval.action.back') }}
          </el-button>
          <el-button
            v-if="actionMode === 'reject'"
            type="danger"
            :loading="submitting"
            @click="submitReject"
          >
            {{ $t('bpm.approval.action.confirmReject') }}
          </el-button>
          <el-button
            v-else
            type="primary"
            :loading="submitting"
            @click="submitApprove"
          >
            <template #icon><Icon icon="lucide:check" /></template>
            {{ $t('bpm.approval.action.approve') }}
          </el-button>
        </template>
      </div>
    </template>
  </el-drawer>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  approveTask,
  getProcessDetail,
  getRejectableNodes,
  rejectTask,
} from '../apis'
import type { RejectableNodeVO, WorkflowInstanceVO, WorkflowTaskVO } from '../apis/type'

defineOptions({ name: 'ApprovalDetailDrawer' })

const props = withDefaults(
  defineProps<{
    /** 流程实例 ID */
    processInstanceId?: string
    /** 当前待办任务 ID，传入则显示审批操作区 */
    taskId?: string
    /** 抽屉宽度 */
    size?: string
  }>(),
  { processInstanceId: '', taskId: '', size: '760px' },
)

const emit = defineEmits<{
  (e: 'approved'): void
  (e: 'rejected'): void
}>()

const { t } = useI18n()

const visible = defineModel<boolean>({ default: false })

const drawerSize = computed(() => (props.size ? props.size : '760px'))

const loading = ref(false)
const submitting = ref(false)
const nodeLoading = ref(false)
const detail = ref<WorkflowInstanceVO>({})

const actionMode = ref<'approve' | 'reject'>('approve')
const actionForm = reactive({ comment: '', targetActivityId: '' })
const rejectableNodes = ref<RejectableNodeVO[]>([])

const showActions = computed(() => Boolean(props.taskId))

const instanceStatusOptions = computed(() => [
  { value: 0, label: t('bpm.approval.status.running') },
  { value: 1, label: t('bpm.approval.status.completed') },
  { value: 2, label: t('bpm.approval.status.cancelled') },
  { value: 3, label: t('bpm.approval.status.rejected') },
])

function statusLabel(status?: number) {
  return instanceStatusOptions.value.find((item) => item.value === status)?.label ?? '-'
}

function statusTagType(status?: number) {
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'info'
    case 3:
      return 'danger'
    default:
      return 'warning'
  }
}

/** 审批耗时：优先用 endTime - createTime，未结束则留空 */
const durationText = computed(() => {
  const start = detail.value?.createTime
  const end = detail.value?.endTime
  if (!start || !end) return '-'
  const diff = new Date(end).getTime() - new Date(start).getTime()
  if (Number.isNaN(diff) || diff < 0) return '-'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return t('bpm.approval.detail.durationMinutes', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('bpm.approval.detail.durationHours', { n: hours })
  return t('bpm.approval.detail.durationDays', { n: Math.floor(hours / 24) })
})

/**
 * 把任务历史 + 当前任务合并成一条按时间排序的节点轨迹。
 * 同一个 taskId 只保留一条，避免历史与当前重复。
 */
const flowNodes = computed(() => {
  const history = detail.value?.taskHistory ?? []
  const current = detail.value?.currentTasks ?? []

  const nodes = history.map((task) => buildNode(task, 'done'))
  const historyIds = new Set(history.map((task) => task.taskId))
  for (const task of current) {
    if (!historyIds.has(task.taskId)) {
      nodes.push(buildNode(task, 'active'))
    }
  }
  return nodes
})

const currentNodes = computed(() => detail.value?.currentTasks ?? [])

function buildNode(task: WorkflowTaskVO, fallbackState: 'done' | 'active') {
  const isReject = task.commentType === 'reject'
  const isDelegate = task.commentType === 'delegate'
  const isDone = Boolean(task.endTime)

  let state: 'done' | 'active' | 'rejected'
  if (isReject) state = 'rejected'
  else if (!isDone && fallbackState === 'active') state = 'active'
  else state = 'done'

  const iconMap = {
    rejected: 'lucide:x',
    active: 'lucide:hourglass',
    done: isDelegate ? 'lucide:arrow-right-left' : 'lucide:check',
  } as const

  const stateLabelMap = {
    rejected: t('bpm.approval.detail.stateRejected'),
    active: t('bpm.approval.detail.stateActive'),
    done: t('bpm.approval.detail.stateDone'),
  } as const

  return {
    key: `${task.taskId}-${task.endTime ?? 'open'}`,
    name: task.taskName || '-',
    state,
    icon: iconMap[state],
    stateLabel: stateLabelMap[state],
    assignee: task.assignee,
    time: task.endTime || task.createTime,
    duration: calcDuration(task.createTime, task.endTime),
    comment: task.comment,
  }
}

function calcDuration(start?: string, end?: string | null) {
  if (!start || !end) return ''
  const diff = new Date(end).getTime() - new Date(start).getTime()
  if (Number.isNaN(diff) || diff < 0) return ''
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function nodeLabel(node: RejectableNodeVO) {
  const name = node.activityName || node.activityId || '-'
  return node.isStartNode ? `${name} (${t('bpm.approval.detail.backToStarter')})` : name
}

async function loadDetail() {
  if (!props.processInstanceId) return
  loading.value = true
  try {
    const { data } = await getProcessDetail(props.processInstanceId)
    detail.value = data ?? {}
  } finally {
    loading.value = false
  }
}

async function switchToReject() {
  actionMode.value = 'reject'
  actionForm.targetActivityId = ''
  if (rejectableNodes.value.length || !props.taskId) return
  nodeLoading.value = true
  try {
    const { data } = await getRejectableNodes(props.taskId)
    rejectableNodes.value = data ?? []
    if (!rejectableNodes.value.length) {
      ElMessage.warning(t('bpm.approval.messages.noRejectableNode'))
    }
  } finally {
    nodeLoading.value = false
  }
}

async function submitApprove() {
  if (!props.taskId) return
  submitting.value = true
  try {
    await approveTask({ taskId: props.taskId, comment: actionForm.comment || undefined })
    ElMessage.success(t('common.messages.operationSuccess'))
    visible.value = false
    emit('approved')
  } finally {
    submitting.value = false
  }
}

async function submitReject() {
  if (!props.taskId) return
  if (!actionForm.targetActivityId) {
    ElMessage.warning(t('bpm.approval.messages.selectTargetNode'))
    return
  }
  submitting.value = true
  try {
    await rejectTask({
      taskId: props.taskId,
      targetActivityId: actionForm.targetActivityId,
      comment: actionForm.comment || undefined,
    })
    ElMessage.success(t('common.messages.operationSuccess'))
    visible.value = false
    emit('rejected')
  } finally {
    submitting.value = false
  }
}

function handleClosed() {
  actionMode.value = 'approve'
  actionForm.comment = ''
  actionForm.targetActivityId = ''
  rejectableNodes.value = []
  detail.value = {}
}

watch(visible, (open) => {
  if (open) void loadDetail()
})

defineExpose({ open: () => (visible.value = true) })
</script>

<style lang="scss" scoped>
// ============ 设计基调 ============
// 冷灰底 + 墨绿强调，衬线式编号制造"档案卷宗"的秩序感，
// 与项目 Outfit / DM Sans 字体体系保持一致。
$ink: #1c2b33;
$muted: #6d7f88;
$line: #e3e9ec;
$accent: #087f5b;
$accent-soft: rgba(8, 127, 91, 0.08);
$danger: #c0392b;
$danger-soft: rgba(192, 57, 43, 0.08);
$paper: #f7f9fa;

.detail-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding-right: 12px;

  &__mark {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 38px;
    height: 38px;
    font-size: 19px;
    color: #fff;
    background: linear-gradient(135deg, $accent, #0a6a4c);
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(8, 127, 91, 0.28);
  }

  &__text {
    min-width: 0;

    h3 {
      margin: 0 0 6px;
      font-family: 'Outfit', sans-serif;
      font-size: 17px;
      font-weight: 600;
      line-height: 1.3;
      color: $ink;
    }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
}

.meta-chip {
  padding: 2px 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  color: $accent;
  letter-spacing: 0.02em;
  background: $accent-soft;
  border-radius: 4px;

  &--ghost {
    color: $muted;
    background: rgba(109, 127, 136, 0.1);
  }
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 4px 4px 8px;
}

.detail-section {
  min-width: 0;
}

.section-head {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding-bottom: 10px;
  margin-bottom: 16px;
  border-bottom: 1px solid $line;
}

.section-index {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: $accent;
  letter-spacing: 0.14em;
}

.section-title {
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: $ink;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.section-count {
  padding: 1px 7px;
  margin-left: auto;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  color: $muted;
  background: rgba(109, 127, 136, 0.1);
  border-radius: 10px;

  &--live {
    color: #b26a00;
    background: rgba(178, 106, 0, 0.12);
  }
}

// ---------- 概览 ----------
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1px;
  overflow: hidden;
  background: $line;
  border: 1px solid $line;
  border-radius: 8px;

  .overview-item {
    padding: 12px 14px;
    background: #fff;

    dt {
      margin-bottom: 5px;
      font-size: 11px;
      color: $muted;
      letter-spacing: 0.04em;
    }

    dd {
      margin: 0;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: $ink;
    }
  }
}

// ---------- 流程轨迹 ----------
.flow-track {
  display: flex;
  flex-direction: column;
}

.flow-node {
  display: flex;
  gap: 14px;

  &__rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 26px;
    padding-top: 2px;
  }

  &__dot {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 26px;
    height: 26px;
    font-size: 13px;
    color: #fff;
    background: $muted;
    border-radius: 50%;
    transition: transform 0.18s ease;
  }

  &__line {
    flex: 1;
    width: 2px;
    min-height: 18px;
    margin: 4px 0;
    background: linear-gradient($line, $line) no-repeat;
  }

  &__card {
    flex: 1;
    min-width: 0;
    padding: 10px 14px 12px;
    margin-bottom: 12px;
    background: $paper;
    border: 1px solid transparent;
    border-radius: 8px;
    transition:
      background 0.18s ease,
      border-color 0.18s ease;

    &:hover {
      background: #fff;
      border-color: $line;
    }
  }

  &__top {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
  }

  &__name {
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: $ink;
  }

  &__state {
    flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    color: $muted;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 7px;
    font-size: 11px;
    color: $muted;

    span {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }
  }

  &__comment {
    display: flex;
    gap: 7px;
    padding: 7px 10px;
    margin-top: 9px;
    font-size: 12px;
    line-height: 1.5;
    color: #445;
    background: #fff;
    border-left: 2px solid $accent;
    border-radius: 0 4px 4px 0;
  }

  // 状态变体
  &.is-done &__dot {
    background: $accent;
    box-shadow: 0 2px 8px rgba(8, 127, 91, 0.3);
  }

  &.is-active &__dot {
    color: $accent;
    background: #fff;
    border: 2px solid $accent;
    animation: pulse-ring 2s ease-in-out infinite;
  }

  &.is-active &__card {
    background: $accent-soft;
    border-color: rgba(8, 127, 91, 0.2);
  }

  &.is-rejected &__dot {
    background: $danger;
    box-shadow: 0 2px 8px rgba(192, 57, 43, 0.3);
  }

  &.is-rejected &__card {
    background: $danger-soft;
    border-color: rgba(192, 57, 43, 0.18);
  }

  &.is-rejected &__comment {
    border-left-color: $danger;
  }

  &.is-last &__card {
    margin-bottom: 0;
  }
}

@keyframes pulse-ring {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(8, 127, 91, 0.35);
  }

  50% {
    box-shadow: 0 0 0 6px rgba(8, 127, 91, 0);
  }
}

// ---------- 待处理 ----------
.pending-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pending-item {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px;
  background: #fff;
  border: 1px solid $line;
  border-left: 3px solid #e8a33d;
  border-radius: 6px;

  &__main {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  &__name {
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: $ink;
  }

  &__assignee {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    font-size: 12px;
    color: $muted;
  }

  &__time {
    flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    color: $muted;
  }
}

// ---------- 操作区 ----------
.action-section {
  padding: 18px;
  background: linear-gradient(180deg, rgba(8, 127, 91, 0.03), transparent);
  border: 1px solid rgba(8, 127, 91, 0.14);
  border-radius: 10px;
}

.action-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.detail-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
