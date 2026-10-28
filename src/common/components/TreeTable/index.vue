<template>
  <el-card shadow="never" class="tree-table-card">
    <div class="tree-table-toolbar">
      <slot name="toolbar" />
    </div>

    <div v-table-loading="loading" class="tree-table-frame" :aria-busy="loading">
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
  padding: var(--p-space-3-5) var(--p-space-5);
  border-bottom: 1px solid var(--theme-border-light);
  background: color-mix(in srgb, var(--theme-bg-surface) 92%, var(--theme-accent-light));
}

.tree-table-toolbar :deep(.el-button + .el-button) {
  margin-left: var(--p-space-2);
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
  margin-right: var(--p-space-1);
  border: 1px solid transparent;
  border-radius: var(--p-radius-md);
  color: var(--theme-text-muted);
  transition:
    color 160ms ease,
    background-color 160ms ease,
    transform 180ms var(--p-ease-out);
}

.tree-table :deep(.el-table__expand-icon:hover) {
  background: var(--theme-accent-light);
  color: var(--theme-accent-strong);
}

.tree-table :deep(.el-table__expand-icon--expanded) {
  color: var(--theme-accent-strong);
}

.tree-table :deep(.el-table__body td:first-child .cell) {
  color: var(--theme-text-primary);
  font-weight: 600;
}

.tree-table :deep(.el-table-fixed-column--right) {
  background: var(--theme-bg-surface);
}

@include sm {
  .tree-table-toolbar {
    min-height: 60px;
    padding: var(--p-space-3) var(--p-space-3-5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tree-table :deep(.el-table__expand-icon) {
    transition: none;
  }
}
</style>
