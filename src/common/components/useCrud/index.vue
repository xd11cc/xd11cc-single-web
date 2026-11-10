<!-- 公共 CRUD 布局壳子：搜索区 / 工具栏 / 表格 / 分页 / 新增修改弹窗 -->
<!-- 差异部分通过 slot 注入，业务页面无需重复写样板代码 -->
<template>
  <div class="app-container">
    <!-- 搜索区：与树形壳共用 -->
    <SearchCard :slotProps="slotProps">
      <template #default="scope">
        <slot name="search-form" v-bind="scope" />
      </template>
    </SearchCard>

    <!-- 表格区 -->
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div class="toolbar-actions-left">
          <slot name="actions" v-bind="slotProps" />
        </div>
        <div class="toolbar-actions-right">
          <TableColumnSetting
            :columns="columnSetting.columns.value"
            @toggle="columnSetting.toggleColumn"
            @reorder="columnSetting.reorderColumns"
            @reset="columnSetting.resetColumns"
          />
          <slot name="actions-right" v-bind="slotProps" />
        </div>
      </div>
      <!-- 冷启动（首次进入 / 换查询条件）：没有旧数据可留，用骨架屏占位，
           避免「空表 → 满表」的空态闪现与高度跳动。
           翻页/刷新不走这里：那时已有数据，保留数据 + 扫描线比清空重画更好。 -->
      <div
        v-if="isColdLoading"
        class="table-wrapper"
        role="status"
        :aria-label="$t('common.loading')"
      >
        <Skeleton variant="table" :rows="skeletonRows" :columns="4" />
      </div>
      <div
        v-else
        v-table-loading="slotProps.tableLoading"
        class="table-wrapper"
        :aria-busy="slotProps.tableLoading"
      >
        <!-- 加载失败：提示 + 重试。请求层的 toast 一闪而过，这里给一个可停留、可操作的落点 -->
        <div v-if="slotProps.tableError" class="table-error" role="alert">
          <el-empty :description="$t('common.messages.loadFailed')" :image-size="72">
            <el-button type="primary" plain @click="slotProps.refresh()">
              {{ $t('common.retry') }}
            </el-button>
          </el-empty>
        </div>
        <div v-else class="table-page-shell">
          <el-table
            v-bind="tableProps"
            :data="slotProps.tableData"
            @selection-change="slotProps.handleSelectionChange"
            @row-click="handleRowClick"
            @header-dragend="columnSetting.onHeaderDragEnd"
          >
            <!-- 选择列等需要固定在生成列之前的内容 -->
            <slot name="table-prefix" v-bind="slotProps" />

            <!-- 生成列：抽象自本壳，两壳共用 -->
            <TableColumns :columns="columnSetting.visibleColumns.value">
              <template v-for="name in cellSlotNames" :key="name" #[name]="scope">
                <slot :name="name" v-bind="scope" />
              </template>
            </TableColumns>

            <!-- 操作列等固定尾列 -->
            <slot name="table-append" v-bind="slotProps" />

            <template v-if="$slots.empty" #empty>
              <slot name="empty" />
            </template>
          </el-table>
        </div>
      </div>
      <div v-if="!hidePagination && !slotProps.tableError" class="page-wrapper">
        <el-pagination
          background
          :layout="slotProps.paginationData.layout"
          :page-sizes="slotProps.paginationData.pageSizes"
          :total="slotProps.paginationData.total"
          :page-size="slotProps.paginationData.pageSize"
          :current-page="slotProps.paginationData.currentPage"
          @size-change="slotProps.handleSizeChange"
          @current-change="slotProps.handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/修改弹窗：与树形壳共用同一实现（含重复提交/过期提交保护） -->
    <FormDialog
      :slotProps="slotProps"
      :form-rules="formRules"
      :add-title="addTitle"
      :edit-title="editTitle"
      :readonly="readonly"
      :dialog-width="dialogWidth"
      :label-width="labelWidth"
      :label-position="labelPosition"
      :submit-disabled="submitDisabled"
    >
      <template #banner>
        <slot name="dialog-banner" />
      </template>
      <slot name="form-fields" v-bind="slotProps" />
    </FormDialog>

    <!-- 页面自有弹窗、抽屉放这里。
         不要放在壳的同级：那会让页面变成多根节点（fragment），
         而 <transition mode="out-in"> + <keep-alive> 要求单一元素根，
         否则进入动画挂不上、页面直接空白。 -->
    <slot name="extra" />
  </div>
</template>

<script lang="ts" setup generic="Q extends Record<string, any>, T extends Record<string, any>">
import { Icon } from '@iconify/vue'
import Skeleton from '@@/components/Skeleton/index.vue'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { FormRules } from 'element-plus'
import type { UseCrudSlotProps } from '@@/composables/useCrud'
import { useCrudShellView } from '@@/composables/useCrudShellView'
import type { CrudShellPropsBase } from '@@/components/crudShell/types'
import TableColumnSetting from '@@/components/TableColumnSetting/index.vue'
import FormDialog from '@@/components/crudShell/FormDialog.vue'
import SearchCard from '@@/components/crudShell/SearchCard.vue'
import TableColumns from '@@/components/crudShell/TableColumns.vue'

defineOptions({ name: 'useCrudView' })

const { t } = useI18n()
const $t = t

const props = defineProps<
  CrudShellPropsBase & {
    slotProps: UseCrudSlotProps<Q, T>
    /** 透传给 el-table 的属性，如 { border: true, height: '520px' } */
    tableProps?: Record<string, unknown>
    /** 后端无分页接口的列表（如在线用户）隐藏分页区 */
    hidePagination?: boolean
  }
>()

const emit = defineEmits<{
  rowClick: [row: any, column: any, event: Event]
}>()

function handleRowClick(row: any, column: any, event: Event) {
  emit('rowClick', row, column, event)
}
/**
 * 冷启动：正在加载且当前没有任何数据（且不是失败态）。
 * 这是唯一使用骨架屏的场景——有旧数据时继续用扫描线，翻页不会整表消失。
 */
const { columnSetting, cellSlotNames, isColdLoading } = useCrudShellView({
  columns: () => props.columns,
  columnKey: () => props.columnKey,
  isLoading: () => props.slotProps.tableLoading,
  isEmpty: () => props.slotProps.tableData.length === 0,
  hasError: () => props.slotProps.tableError,
})

/** 骨架行数跟每页条数走，最多 10 行，避免 pageSize=100 时拉出一屏灰条 */
const skeletonRows = computed(() => Math.min(props.slotProps.paginationData.pageSize || 10, 10))
</script>
