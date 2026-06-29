<template>
  <el-popover placement="bottom-end" :width="220" trigger="click">
    <template #reference>
      <el-button circle size="small" title="列配置">
        <Icon icon="lucide:settings-2" />
      </el-button>
    </template>
    <div class="column-setting">
      <div class="column-setting-header">
        <span>列配置</span>
        <el-button type="primary" link size="small" @click="emit('reset')">重置</el-button>
      </div>
      <div class="column-setting-list">
        <div
          v-for="(col, index) in sortedColumns"
          :key="col.prop"
          class="column-setting-item"
          draggable="true"
          @dragstart="handleDragStart(index)"
          @dragover.prevent="handleDragOver(index)"
          @drop="handleDrop(index)"
        >
          <Icon icon="lucide:grip-vertical" class="drag-handle" />
          <el-checkbox
            :model-value="col.visible"
            @change="emit('toggle', col.prop)"
          >
            {{ col.label }}
          </el-checkbox>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import type { TableColumnConfig } from '@@/composables/useTableColumns'

const props = defineProps<{
  columns: TableColumnConfig[]
}>()

const emit = defineEmits<{
  toggle: [prop: string]
  reorder: [from: number, to: number]
  reset: []
}>()

const sortedColumns = computed(() =>
  [...props.columns].sort((a, b) => a.order - b.order),
)

let dragIndex = -1

function handleDragStart(index: number) {
  dragIndex = index
}

function handleDragOver(index: number) {
  // visual feedback handled by CSS
}

function handleDrop(index: number) {
  if (dragIndex !== index) {
    emit('reorder', dragIndex, index)
  }
  dragIndex = -1
}
</script>

<style lang="scss" scoped>
.column-setting {
  .column-setting-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--theme-border);
    font-size: 13px;
    font-weight: var(--p-weight-semibold);
    color: var(--theme-text-primary);
  }

  .column-setting-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .column-setting-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    cursor: grab;
    border-radius: var(--p-radius-sm);
    transition: background var(--p-duration-fast);

    &:hover {
      background: var(--theme-bg-elevated);
    }

    &:active {
      cursor: grabbing;
    }

    .drag-handle {
      font-size: 14px;
      color: var(--theme-text-muted);
      cursor: grab;
    }
  }
}
</style>
