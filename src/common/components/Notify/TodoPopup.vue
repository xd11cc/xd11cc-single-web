<template>
  <el-dialog
    v-model="visible"
    :title="$t('layout.notify.todo.dialogTitle')"
    width="480px"
    align-center
    class="todo-popup"
    :close-on-click-modal="false"
    :lock-scroll="false"
    append-to-body
    @closed="handleClosed"
  >
    <template #header>
      <div class="todo-popup-header">
        <div class="todo-popup-heading">
          <span class="todo-popup-title">{{ $t('layout.notify.todo.dialogTitle') }}</span>
          <el-tag v-if="totalCount > 1" type="warning" effect="plain" size="small" round>
            {{ $t('layout.notify.todo.badge', { count: totalCount }) }}
          </el-tag>
        </div>
      </div>
    </template>

    <div v-if="current" class="todo-popup-body">
      <div class="todo-popup-meta">
        <Icon icon="lucide:clipboard-check" class="todo-popup-icon" />
        <span>{{
          current.senderName
            ? $t('layout.notify.todo.from', {
                sender: current.senderName,
                time: current.sendTime || '-',
              })
            : $t('layout.notify.todo.single')
        }}</span>
      </div>

      <div class="todo-popup-subject">{{ current.title || '-' }}</div>
      <p v-if="current.content" class="todo-popup-desc">{{ current.content }}</p>

      <div v-if="totalCount > 1" class="todo-popup-progress">
        <span>{{
          $t('layout.notify.todo.current', { current: position, total: totalCount })
        }}</span>
        <span class="todo-popup-bar">
          <i :style="{ width: `${(position / totalCount) * 100}%` }" />
        </span>
      </div>
    </div>

    <template #footer>
      <div class="todo-popup-footer">
        <el-button @click="handleLater">{{ $t('layout.notify.actionLater') }}</el-button>
        <el-button type="primary" plain @click="handleView">
          {{ $t('layout.notify.actionView') }}
        </el-button>
        <el-button v-if="canQuickApprove" type="success" @click="handleApprove">
          {{ $t('layout.notify.actionApprove') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useTodoQueue } from '@@/composables/useTodoQueue'
import { openApprovalTodo } from '@@/utils/notice-navigation'

const router = useRouter()
const { current, visible, totalCount, queue, dismiss, resolveCurrent } = useTodoQueue()

// 当前是第几条：已展示 1 条 + 已出队条数
const position = computed(() => Math.max(1, totalCount.value - queue.value.length))

// 只有后端下发了流程实例信息时才展示“快速通过”，避免信息不全时误操作
const canQuickApprove = computed(() =>
  Boolean(current.value?.processInstanceId && current.value?.taskId),
)

function handleLater() {
  visible.value = false
}

function handleView() {
  const todo = current.value
  openApprovalTodo(router, {
    processInstanceId: todo?.processInstanceId,
    taskId: todo?.taskId,
  })
  resolveCurrent()
}

function handleApprove() {
  const todo = current.value
  openApprovalTodo(router, {
    processInstanceId: todo?.processInstanceId,
    taskId: todo?.taskId,
    quickApprove: true,
  })
  resolveCurrent()
}

function handleClosed() {
  // 点击遮罩/ESC 等关闭方式都算“稍后处理”，继续展示下一条
  if (current.value) dismiss()
}
</script>

<style lang="scss" scoped>
.todo-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.todo-popup-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.todo-popup-title {
  font-size: var(--p-text-lg);
  font-weight: 600;
  color: var(--theme-text-primary);
}

.todo-popup-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-popup-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--p-text-base);
  color: var(--theme-text-secondary);
}

.todo-popup-icon {
  color: var(--theme-warning);
}

.todo-popup-subject {
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--theme-bg-elevated);
  border-left: 3px solid var(--theme-warning);
  font-size: var(--p-text-lg);
  font-weight: 600;
  color: var(--theme-text-primary);
  line-height: 1.5;
  word-break: break-word;
}

.todo-popup-desc {
  margin: 0;
  font-size: var(--p-text-base);
  line-height: 1.6;
  color: var(--theme-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.todo-popup-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--p-text-sm);
  color: var(--theme-text-muted);

  .todo-popup-bar {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: var(--theme-bg-sunken);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: 2px;
      background: var(--theme-warning);
      transition: width 0.25s ease;
    }
  }
}

.todo-popup-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
