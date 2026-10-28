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

    <div v-table-loading="loading" class="detail-body">
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
                <span v-if="node.time"> <Icon icon="lucide:clock" />{{ node.time }} </span>
                <span v-if="node.duration"> <Icon icon="lucide:timer" />{{ node.duration }} </span>
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
          <el-button v-if="actionMode !== 'reject'" type="danger" plain @click="switchToReject">
            <template #icon><Icon icon="lucide:undo-2" /></template>
            {{ $t('bpm.approval.action.reject') }}
          </el-button>
          <el-button v-if="actionMode === 'reject'" @click="actionMode = 'approve'">
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
          <el-button v-else type="primary" :loading="submitting" @click="submitApprove">
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
import { approveTask, getProcessDetail, getRejectableNodes, rejectTask } from '../apis'
import { INSTANCE_STATUS } from '../apis/type'
import { useDict } from '@/common/composables/useDict'
import type {
  InstanceStatus,
  RejectableNodeVO,
  WorkflowInstanceVO,
  WorkflowTaskVO,
} from '../apis/type'

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

// 状态文案与标签色由字典 workflow_status 提供（后端 char(2)，必须字符串比较）
const { getDictItem: getStatusDictItem } = useDict(['workflow_status'])

function statusLabel(status?: InstanceStatus) {
  if (!status) return '-'
  return getStatusDictItem('workflow_status', status)?.value ?? status
}

function statusTagType(status?: InstanceStatus) {
  return getStatusDictItem('workflow_status', status ?? '')?.listClass ?? 'info'
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
// 冷灰底 + 墨绿强调，衬线式编号制造"档案卷宗"的秩序感。
// 所有颜色取自设计系统令牌，跟随亮/暗主题自动切换，不再写死色值。
$ink: var(--theme-text-primary);
$muted: var(--theme-text-secondary);
$line: var(--theme-border);
$accent: var(--theme-accent);
$accent-soft: var(--theme-accent-light);
$danger: var(--theme-danger);
$danger-soft: var(--theme-danger-light);
$paper: var(--theme-bg-page);

.detail-header {
  display: flex;
  gap: var(--p-space-3-5);
  align-items: flex-start;
  padding-right: var(--p-space-3);

  &__mark {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 38px;
    height: 38px;
    font-size: var(--p-text-xl);
    color: #fff;
    background: var(--theme-accent-gradient);
    border-radius: var(--p-radius-lg);
    box-shadow: 0 4px 12px var(--theme-accent-glow);
  }

  &__text {
    min-width: 0;

    h3 {
      margin: 0 0 var(--p-space-1-5);
      font-family: 'Outfit', sans-serif;
      font-size: var(--p-text-xl);
      font-weight: 600;
      line-height: 1.3;
      color: $ink;
    }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--p-space-1-5);
    align-items: center;
  }
}

.meta-chip {
  padding: var(--p-space-0-5) var(--p-space-2);
  font-family: 'DM Sans', sans-serif;
  font-size: var(--p-text-xs);
  color: $accent;
  letter-spacing: 0.02em;
  background: $accent-soft;
  border-radius: var(--p-radius-sm);

  &--ghost {
    color: $muted;
    background: var(--theme-bg-elevated);
  }
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-7);
  padding: var(--p-space-1) var(--p-space-1) var(--p-space-2);
}

.detail-section {
  min-width: 0;
}

.section-head {
  display: flex;
  gap: var(--p-space-2-5);
  align-items: baseline;
  padding-bottom: var(--p-space-2-5);
  margin-bottom: var(--p-space-4);
  border-bottom: 1px solid $line;
}

.section-index {
  font-family: 'DM Sans', sans-serif;
  font-size: var(--p-text-xs);
  font-weight: 600;
  color: $accent;
  letter-spacing: 0.14em;
}

.section-title {
  font-family: 'Outfit', sans-serif;
  font-size: var(--p-text-base);
  font-weight: 600;
  color: $ink;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.section-count {
  padding: 1px 7px;
  margin-left: auto;
  font-family: 'DM Sans', sans-serif;
  font-size: var(--p-text-xs);
  color: $muted;
  background: var(--theme-bg-elevated);
  border-radius: var(--p-radius-lg);

  &--live {
    color: var(--theme-warning);
    background: var(--theme-warning-light);
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
  border-radius: var(--p-radius-lg);

  .overview-item {
    padding: var(--p-space-3) var(--p-space-3-5);
    background: var(--theme-bg-surface);

    dt {
      margin-bottom: 5px;
      font-size: var(--p-text-xs);
      color: $muted;
      letter-spacing: 0.04em;
    }

    dd {
      margin: 0;
      font-family: 'DM Sans', sans-serif;
      font-size: var(--p-text-base);
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
  gap: var(--p-space-3-5);

  &__rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 26px;
    padding-top: var(--p-space-0-5);
  }

  &__dot {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 26px;
    height: 26px;
    font-size: var(--p-text-base);
    color: #fff;
    background: $muted;
    border-radius: 50%;
    transition: transform var(--p-duration-normal) ease;
  }

  &__line {
    flex: 1;
    width: 2px;
    min-height: 18px;
    margin: var(--p-space-1) 0;
    background: linear-gradient($line, $line) no-repeat;
  }

  &__card {
    flex: 1;
    min-width: 0;
    padding: var(--p-space-2-5) var(--p-space-3-5) var(--p-space-3);
    margin-bottom: var(--p-space-3);
    background: $paper;
    border: 1px solid transparent;
    border-radius: var(--p-radius-lg);
    transition:
      background var(--p-duration-normal) ease,
      border-color var(--p-duration-normal) ease;

    &:hover {
      background: var(--theme-bg-surface);
      border-color: $line;
    }
  }

  &__top {
    display: flex;
    gap: var(--p-space-2-5);
    align-items: center;
    justify-content: space-between;
  }

  &__name {
    font-family: 'Outfit', sans-serif;
    font-size: var(--p-text-base);
    font-weight: 600;
    color: $ink;
  }

  &__state {
    flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
    font-size: var(--p-text-xs);
    color: $muted;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--p-space-3);
    margin-top: 7px;
    font-size: var(--p-text-xs);
    color: $muted;

    span {
      display: inline-flex;
      gap: var(--p-space-1);
      align-items: center;
    }
  }

  &__comment {
    display: flex;
    gap: 7px;
    padding: 7px 10px;
    margin-top: 9px;
    font-size: var(--p-text-sm);
    line-height: 1.5;
    color: var(--theme-text-secondary);
    background: var(--theme-bg-surface);
    border-left: 2px solid $accent;
    border-radius: 0 var(--p-radius-sm) var(--p-radius-sm) 0;
  }

  &.is-done &__dot {
    background: $accent;
    box-shadow: 0 2px 8px var(--theme-accent-glow);
  }

  &.is-active &__dot {
    color: $accent;
    background: var(--theme-bg-surface);
    border: 2px solid $accent;
    animation: pulse-ring 2s ease-in-out infinite;
  }

  &.is-active &__card {
    background: $accent-soft;
    border-color: var(--theme-accent);
  }

  &.is-rejected &__dot {
    background: $danger;
    box-shadow: 0 2px 8px var(--theme-danger);
  }

  &.is-rejected &__card {
    background: $danger-soft;
    border-color: var(--theme-danger);
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
    box-shadow: 0 0 0 0 var(--theme-accent-glow);
  }

  50% {
    box-shadow: 0 0 0 6px transparent;
  }
}

// ---------- 待处理 ----------
.pending-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-2);
}

.pending-item {
  display: flex;
  gap: var(--p-space-3);
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px;
  background: var(--theme-bg-surface);
  border: 1px solid $line;
  border-left: 3px solid var(--theme-warning);
  border-radius: var(--p-radius-md);

  &__main {
    display: flex;
    flex-wrap: wrap;
    gap: var(--p-space-2-5);
    align-items: center;
    min-width: 0;
  }

  &__name {
    font-family: 'Outfit', sans-serif;
    font-size: var(--p-text-base);
    font-weight: 600;
    color: $ink;
  }

  &__assignee {
    display: inline-flex;
    gap: var(--p-space-1);
    align-items: center;
    font-size: var(--p-text-sm);
    color: $muted;
  }

  &__time {
    flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
    font-size: var(--p-text-xs);
    color: $muted;
  }
}

// ---------- 操作区 ----------
.action-section {
  padding: var(--p-space-4-5);
  background: var(--theme-accent-light);
  border: 1px solid var(--theme-border);
  border-radius: var(--p-radius-lg);
}

.action-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.detail-footer {
  display: flex;
  gap: var(--p-space-2);
  justify-content: flex-end;
}
</style>
