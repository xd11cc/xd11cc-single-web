<!-- 生成列：按「用户排序 + 显隐」渲染表头，单元格默认取 row[prop]，可用 #cell-<prop> 覆盖 -->
<template>
  <el-table-column
    v-for="col in columns"
    :key="col.prop"
    :prop="col.prop"
    :label="col.label"
    :width="col.width"
    :min-width="col.minWidth"
    :align="col.align"
    :fixed="col.fixed"
    :show-overflow-tooltip="col.showOverflowTooltip !== false"
  >
    <template #default="scope">
      <slot :name="`cell-${col.prop}`" v-bind="scope">
        {{ scope.row?.[col.prop] ?? '-' }}
      </slot>
    </template>
  </el-table-column>
</template>

<script lang="ts" setup>
import type { TableColumnConfig } from '@@/composables/useTableColumns'

/**
 * 生成列（列表壳与树形壳共用）。
 *
 * 只负责「把列定义渲染成 el-table-column」，排序/显隐/列宽由 useTableColumns 提供。
 * 自定义单元格仍走 `#cell-<prop>`：壳会把它转发进来，未提供的列落到默认取值。
 *
 * 说明：el-table-column 通过 provide/inject 向 el-table 注册，因此包一层组件
 * 不影响列注册（已在真实 el-table 上验证）。
 */

defineProps<{ columns: TableColumnConfig[] }>()
</script>
