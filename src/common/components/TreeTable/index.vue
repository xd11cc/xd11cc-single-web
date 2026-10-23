<template>
  <el-card shadow="never" class="tree-table-card">
    <div class="tree-table-toolbar">
      <slot name="toolbar" />
    </div>

    <div class="tree-table-frame" :aria-busy="loading">
      <el-table
        ref="tableRef"
        :data="data"
        :row-key="rowKey"
        :tree-props="treeProps"
        :default-expand-all="defaultExpandAll"
        class="tree-table"
        @row-click="handleRowClick"
      >
        <slot />
      </el-table>

      <div
        class="tree-table-loading"
        :class="{ 'is-active': loading }"
        role="status"
        :aria-label="$t('common.loading')"
        aria-live="polite"
      />
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import type { TableInstance } from 'element-plus'

defineOptions({ name: 'TreeTableView' })

withDefaults(
  defineProps<{
    data: any[]
    loading?: boolean
    rowKey: string
    treeProps?: { children?: string; hasChildren?: string }
    defaultExpandAll?: boolean
  }>(),
  {
    loading: false,
    treeProps: () => ({ children: 'children', hasChildren: 'hasChildren' }),
    defaultExpandAll: false,
  },
)

const emit = defineEmits<{
  rowClick: [row: any, column: any, event: Event]
}>()

const tableRef = useTemplateRef<TableInstance>('tableRef')

function handleRowClick(row: any, column: any, event: Event) {
  emit('rowClick', row, column, event)
}

function toggleRowExpansion(row: any, expanded?: boolean) {
  tableRef.value?.toggleRowExpansion(row, expanded)
}

function toggleAll(rows: any[], expanded: boolean) {
  rows.forEach((row) => {
    toggleRowExpansion(row, expanded)
    if (row.children?.length) toggleAll(row.children, expanded)
  })
}

defineExpose({ tableRef, toggleRowExpansion, toggleAll })
</script>

<style scoped>
.tree-table-card {
  overflow: hidden;
  border-color: var(--theme-border-light);
  background: var(--theme-bg-surface);
}

.tree-table-card :deep(.el-card__body) {
  padding: 0;
}

.tree-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 68px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--theme-border-light);
  background: color-mix(in srgb, var(--theme-bg-surface) 92%, var(--theme-accent-light));
}

.tree-table-toolbar :deep(.el-button + .el-button) {
  margin-left: 8px;
}

.tree-table-frame {
  position: relative;
  overflow: hidden;
}

.tree-table :deep(.el-table__body tr:hover td:first-child) {
  box-shadow: inset 3px 0 0 var(--theme-accent);
}

.tree-table :deep(.el-table__indent) {
  width: 18px;
}

.tree-table :deep(.el-table__expand-icon) {
  display: inline-grid;
  width: 22px;
  height: 22px;
  place-items: center;
  margin-right: 4px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--theme-text-muted);
  transition:
    color 160ms ease,
    background-color 160ms ease,
    transform 180ms var(--p-ease-out);
}

.tree-table :deep(.el-table__expand-icon:hover) {
  background: var(--theme-accent-light);
  color: var(--theme-accent);
}

.tree-table :deep(.el-table__expand-icon--expanded) {
  color: var(--theme-accent);
}

.tree-table :deep(.el-table__body td:first-child .cell) {
  color: var(--theme-text-primary);
  font-weight: 600;
}

.tree-table :deep(.el-table-fixed-column--right) {
  background: var(--theme-bg-surface);
}

.tree-table-loading {
  position: absolute;
  inset: 0;
  z-index: 4;
  border-top: 2px solid transparent;
  background: color-mix(in srgb, var(--theme-bg-surface) 90%, transparent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
}

.tree-table-loading::before {
  position: absolute;
  top: -2px;
  left: -32%;
  width: 32%;
  height: 2px;
  content: '';
  background: linear-gradient(90deg, transparent, var(--theme-accent), transparent);
}

.tree-table-loading.is-active {
  opacity: 1;
  pointer-events: auto;
}

.tree-table-loading.is-active::before {
  animation: tree-table-loading-sweep 1.1s var(--p-ease-in-out) infinite;
}

@keyframes tree-table-loading-sweep {
  to {
    transform: translateX(412%);
  }
}

@media (max-width: 768px) {
  .tree-table-toolbar {
    min-height: 60px;
    padding: 12px 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tree-table :deep(.el-table__expand-icon),
  .tree-table-loading {
    transition: none;
  }

  .tree-table-loading.is-active::before {
    animation: none;
  }
}
</style>
