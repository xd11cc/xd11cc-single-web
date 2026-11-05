<!-- 树形列表公共壳：搜索区 / 工具栏 / 树表 / 新增修改弹窗 -->
<!-- 与 useCrud + UseCrudView 同构，区别是不分页、支持「新增子级」和整树展开收起 -->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="slotProps.searchData">
        <slot name="search-form" v-bind="slotProps" />
        <el-form-item>
          <el-button type="primary" @click="slotProps.handleSearch">
            <template #icon><Icon icon="lucide:search" /></template>{{ $t('common.search') }}
          </el-button>
          <el-button @click="slotProps.resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>{{ $t('common.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

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

        <el-table-column
          v-for="col in columnSetting.visibleColumns.value"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :align="col.align"
          :show-overflow-tooltip="col.showOverflowTooltip !== false"
        >
          <template #default="scope">
            <slot :name="`cell-${col.prop}`" v-bind="scope">
              {{ scope.row?.[col.prop] ?? '-' }}
            </slot>
          </template>
        </el-table-column>

        <slot name="table-append" v-bind="slotProps" />

        <template v-if="$slots.empty" #empty>
          <slot name="empty" />
        </template>
      </TreeTableView>
    </el-card>

    <!-- 新增/修改弹窗 -->
    <el-dialog
      v-if="!readonly"
      v-model="slotProps.dialogVisible"
      :title="dialogTitle"
      :width="dialogWidth || 'min(760px, calc(100vw - 32px))'"
      destroy-on-close
      @close="slotProps.handleClose"
    >
      <el-form
        ref="formRef"
        class="adaptive-form"
        :model="slotProps.formData"
        :rules="formRules"
        :label-width="labelWidth"
        :label-position="labelPosition"
      >
        <el-row :gutter="20">
          <slot name="form-fields" v-bind="slotProps" />
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="slotProps.handleClose">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleFormSubmit">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 页面自有弹窗、抽屉放这里，保证壳只有一个根节点（理由同 UseCrudView） -->
    <slot name="extra" />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { computed, onScopeDispose, ref, watch } from 'vue'
import type { FormRules } from 'element-plus'
import TreeTableView from '@@/components/TreeTable/index.vue'
import Skeleton from '@@/components/Skeleton/index.vue'
import TableColumnSetting from '@@/components/TableColumnSetting/index.vue'
import { useTableColumns } from '@@/composables/useTableColumns'
import type { TableColumnDef } from '@@/composables/useTableColumns'
import { useRoute } from 'vue-router'
import type { UseTreeCrudSlotProps } from '@@/composables/useTreeCrud'

defineOptions({ name: 'TreeCrudView' })

const { t } = useI18n()
const $t = t

const props = withDefaults(
  defineProps<{
    slotProps: UseTreeCrudSlotProps
    /** 表头列定义（必填，不含树列；树列放 #table-prefix） */
    columns: TableColumnDef[]
    /** 列偏好持久化键，默认取当前路由名 */
    columnKey?: string
    /** 新增/修改共用表单校验规则；只读列表可不传 */
    formRules?: FormRules
    addTitle?: string
    editTitle?: string
    /** 只读列表：不渲染新增/修改弹窗 */
    readonly?: boolean
    dialogWidth?: string
    /** 表单标签宽度，默认 168px */
    labelWidth?: string
    labelPosition?: 'left' | 'right' | 'top'
    /** 树表主键字段，默认 id */
    rowKey?: string
    /** 初始是否全部展开 */
    defaultExpanded?: boolean
  }>(),
  {
    readonly: false,
    labelWidth: '168px',
    labelPosition: 'left',
    rowKey: 'id',
    defaultExpanded: false,
  },
)

const emit = defineEmits<{
  rowClick: [row: any, column: any, event: Event]
}>()

const formRef = ref<any>(null)
const submitLoading = ref(false)
const treeTableRef = ref<InstanceType<typeof TreeTableView> | null>(null)
/** 传了 columns 才启用列配置；与列表壳同一套「定义 + 偏好」模型 */
const route = useRoute()
const columnSetting = useTableColumns({
  key: props.columnKey || (route?.name ? String(route.name) : 'crud'),
  columns: () => props.columns,
})

/** 冷启动：加载中且没有任何树数据（失败态单独分支） */
const isColdLoading = computed(
  () =>
    props.slotProps.loading && props.slotProps.treeData.length === 0 && !props.slotProps.treeError,
)

let dialogSessionId = 0
let isDisposed = false

onScopeDispose(() => {
  isDisposed = true
  dialogSessionId++
})

// 展开状态：与 defaultExpanded 保持一致，供工具栏按钮文案切换
const isExpanded = ref(props.defaultExpanded)

const dialogTitle = computed(() => {
  const isAdd = props.slotProps.formData?.id === undefined
  if (props.addTitle && props.editTitle) return isAdd ? props.addTitle : props.editTitle
  return isAdd ? $t('common.add') : $t('common.edit')
})

async function handleFormSubmit() {
  const form = formRef.value
  if (isDisposed || submitLoading.value || !props.slotProps.dialogVisible || !form) return
  const formData = props.slotProps.formData
  const sessionId = dialogSessionId
  submitLoading.value = true
  try {
    const valid = await form.validate?.()
    if (
      !valid ||
      isDisposed ||
      sessionId !== dialogSessionId ||
      !props.slotProps.dialogVisible ||
      formData !== props.slotProps.formData
    )
      return
    const isAdd = formData?.id === undefined
    await props.slotProps.handleSubmit(isAdd)
  } catch {
    return
  } finally {
    if (!isDisposed) submitLoading.value = false
  }
}

// 关闭后清校验，下次打开是干净的
watch(
  () => props.slotProps.dialogVisible,
  (val) => {
    dialogSessionId++
    if (!val) formRef.value?.clearValidate?.()
  },
  { flush: 'sync' },
)

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
