<!-- 树形列表公共壳：搜索区 / 工具栏 / 树表 / 新增修改弹窗 -->
<!-- 与 useCrud + UseCrudView 同构，区别是不分页、支持「新增子级」和整树展开收起 -->
<template>
  <div class="app-container">
    <!-- 搜索区：与树形壳共用 -->
    <SearchCard :slotProps="slotProps">
      <template #default="scope">
        <slot name="search-form" v-bind="scope" />
      </template>
    </SearchCard>

    <!-- 树表区 -->
    <el-card shadow="never">
      <div v-if="slotProps.treeError" class="table-error" role="alert">
        <el-empty :description="$t('common.messages.loadFailed')" :image-size="72">
          <el-button type="primary" plain @click="slotProps.refresh()">
            {{ $t('common.retry') }}
          </el-button>
        </el-empty>
      </div>
      <!-- 冷启动：还没有任何树数据时用骨架占位；已有数据时仍走树表的扫描线 -->
      <div v-else-if="isColdLoading" role="status" :aria-label="$t('common.loading')">
        <Skeleton variant="table" :rows="6" :columns="4" />
      </div>
      <TreeTableView
        v-else
        ref="treeTableRef"
        :data="slotProps.treeData"
        :loading="slotProps.loading"
        :row-key="rowKey"
        :default-expand-all="isExpanded"
        @row-click="handleRowClick"
        @header-dragend="columnSetting.onHeaderDragEnd"
      >
        <template #toolbar>
          <div>
            <slot name="actions" v-bind="slotProps" />
          </div>
          <div>
            <el-button @click="toggleExpand">
              <template #icon><Icon icon="lucide:arrow-up-down" /></template>
              {{ isExpanded ? $t('common.collapseAll') : $t('common.expandAll') }}
            </el-button>
            <TableColumnSetting
              :columns="columnSetting.columns.value"
              @toggle="columnSetting.toggleColumn"
              @reorder="columnSetting.reorderColumns"
              @reset="columnSetting.resetColumns"
            />
            <slot name="actions-right" v-bind="slotProps" />
          </div>
        </template>

        <!-- 树列（含展开箭头与缩进）必须固定在生成列之前 -->
        <slot name="table-prefix" v-bind="slotProps" />

        <TableColumns :columns="columnSetting.visibleColumns.value">
          <template v-for="name in cellSlotNames" :key="name" #[name]="scope">
            <slot :name="name" v-bind="scope" />
          </template>
        </TableColumns>

        <slot name="table-append" v-bind="slotProps" />

        <template v-if="$slots.empty" #empty>
          <slot name="empty" />
        </template>
      </TreeTableView>
    </el-card>

    <!-- 新增/修改弹窗：与列表壳共用同一实现（含重复提交/过期提交保护） -->
    <FormDialog
      :slotProps="slotProps"
      :form-rules="formRules"
      :add-title="addTitle"
      :edit-title="editTitle"
      :readonly="readonly"
      :dialog-width="dialogWidth"
      :label-width="labelWidth"
      :label-position="labelPosition"
    >
      <slot name="form-fields" v-bind="slotProps" />
    </FormDialog>

    <!-- 页面自有弹窗、抽屉放这里，保证壳只有一个根节点（理由同 UseCrudView） -->
    <slot name="extra" />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import type { FormRules } from 'element-plus'
import TreeTableView from '@@/components/TreeTable/index.vue'
import Skeleton from '@@/components/Skeleton/index.vue'
import TableColumnSetting from '@@/components/TableColumnSetting/index.vue'
import { useCrudShellView } from '@@/composables/useCrudShellView'
import type { CrudShellPropsBase } from '@@/components/crudShell/types'
import { useRoute } from 'vue-router'
import type { UseTreeCrudSlotProps } from '@@/composables/useTreeCrud'
import FormDialog from '@@/components/crudShell/FormDialog.vue'
import SearchCard from '@@/components/crudShell/SearchCard.vue'
import TableColumns from '@@/components/crudShell/TableColumns.vue'

defineOptions({ name: 'TreeCrudView' })

const { t } = useI18n()
const $t = t

const props = withDefaults(
  defineProps<
    CrudShellPropsBase & {
      slotProps: UseTreeCrudSlotProps
      /** 树表主键字段，默认 id */
      rowKey?: string
      /** 初始是否全部展开 */
      defaultExpanded?: boolean
    }
  >(),
  { rowKey: 'id', defaultExpanded: false },
)

const emit = defineEmits<{
  rowClick: [row: any, column: any, event: Event]
}>()

const treeTableRef = ref<InstanceType<typeof TreeTableView> | null>(null)
/** 传了 columns 才启用列配置；与列表壳同一套「定义 + 偏好」模型 */
const { columnSetting, cellSlotNames, isColdLoading } = useCrudShellView({
  columns: () => props.columns,
  columnKey: () => props.columnKey,
  isLoading: () => props.slotProps.loading,
  isEmpty: () => props.slotProps.treeData.length === 0,
  hasError: () => props.slotProps.treeError,
})

// 展开状态：与 defaultExpanded 保持一致，供工具栏按钮文案切换
const isExpanded = ref(props.defaultExpanded)

/** 整树展开 / 收起 */
function toggleExpand() {
  isExpanded.value = !isExpanded.value
  const table = treeTableRef.value
  if (!table) return

  const walk = (rows: any[]) => {
    rows.forEach((row) => {
      table.toggleRowExpansion(row, isExpanded.value)
      if (row.children?.length) walk(row.children)
    })
  }
  walk(props.slotProps.treeData)
}

/** 点击整行时展开/收起该节点；点按钮不触发 */
function handleRowClick(row: any, column: any, event: Event) {
  if ((event?.target as HTMLElement)?.closest?.('.el-button')) return
  if (row?.children?.length) {
    treeTableRef.value?.toggleRowExpansion(row)
  }
  emit('rowClick', row, column, event)
}

defineExpose({ treeTableRef, toggleExpand })
</script>
