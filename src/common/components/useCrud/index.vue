<!-- 公共 CRUD 布局壳子：搜索区 / 工具栏 / 表格 / 分页 / 新增修改弹窗 -->
<!-- 差异部分通过 slot 注入，业务页面无需重复写样板代码 -->
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

    <!-- 表格区 -->
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div class="toolbar-actions-left">
          <slot name="actions" v-bind="slotProps" />
        </div>
        <div class="toolbar-actions-right">
          <TableColumnSetting
            v-if="columnSetting"
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
            @header-dragend="handleHeaderDragEnd"
          >
            <!-- 选择列等需要固定在生成列之前的内容 -->
            <slot name="table-prefix" v-bind="slotProps" />

            <!-- 传了 columns：由壳按「用户排序 + 显隐」生成列，
                 单元格默认取 row[prop]，需要自定义就用 #cell-<prop> 插槽 -->
            <template v-if="columnSetting">
              <el-table-column
                v-for="col in columnSetting.visibleColumns.value"
                :key="col.prop"
                :prop="col.prop"
                :label="col.label"
                :width="col.width"
                :min-width="col.minWidth"
                :align="col.align"
                :fixed="col.fixed"
              >
                <template #default="scope">
                  <slot :name="`cell-${col.prop}`" v-bind="scope">
                    {{ scope.row?.[col.prop] ?? '-' }}
                  </slot>
                </template>
              </el-table-column>
            </template>

            <!-- 没传 columns：沿用页面自己写 el-table-column 的方式 -->
            <slot v-else name="table" v-bind="slotProps" />

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

    <!-- 页面自有弹窗、抽屉放这里。
         不要放在壳的同级：那会让页面变成多根节点（fragment），
         而 <transition mode="out-in"> + <keep-alive> 要求单一元素根，
         否则进入动画挂不上、页面直接空白。 -->
    <slot name="extra" />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import Skeleton from '@@/components/Skeleton/index.vue'
import { useI18n } from 'vue-i18n'
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { FormRules } from 'element-plus'
import type { UseCrudSlotProps } from '@@/composables/useCrud'
import { useTableColumns } from '@@/composables/useTableColumns'
import type { TableColumnDef } from '@@/composables/useTableColumns'
import TableColumnSetting from '@@/components/TableColumnSetting/index.vue'

defineOptions({ name: 'useCrudView' })

const { t } = useI18n()
const $t = t

const props = defineProps<{
  slotProps: UseCrudSlotProps
  /**
   * 表头列定义。传了它，表格列由壳生成：
   * 排序/显隐/列宽由用户控制并持久化，单元格用 `#cell-<prop>` 自定义。
   * 不传则保持旧行为（页面自己在 `#table` 里写 el-table-column）。
   */
  columns?: TableColumnDef[]
  /** 列偏好的持久化键，默认取当前路由名 */
  columnKey?: string
  /** 新增/修改共用表单校验规则；只读列表可不传 */
  formRules?: FormRules
  /** 弹窗标题，不传则自动根据新增/修改生成 */
  addTitle?: string
  editTitle?: string
  /** 只读列表：不渲染新增/修改弹窗，仅保留搜索、表格、分页 */
  readonly?: boolean
  /** 弹窗宽度，默认 min(760px, calc(100vw - 32px)) */
  dialogWidth?: string
  /** 透传给 el-table 的属性，如 { border: true, height: '520px' } */
  tableProps?: Record<string, unknown>
  /** 表单标签宽度，默认 168px；窄标签页面（如 notice）可传 144px */
  labelWidth?: string
  /** 表单标签位置，默认 left */
  labelPosition?: 'left' | 'right' | 'top'
  /** 后端无分页接口的列表（如在线用户）隐藏分页区 */
  hidePagination?: boolean
}>()

const labelWidth = computed(() => props.labelWidth ?? '168px')
const labelPosition = computed(() => props.labelPosition ?? 'left')

const emit = defineEmits<{
  rowClick: [row: any, column: any, event: Event]
}>()

const formRef = ref<any>(null)

function handleRowClick(row: any, column: any, event: Event) {
  emit('rowClick', row, column, event)
}
const submitLoading = ref(false)

const dialogTitle = computed(() => {
  if (props.addTitle && props.editTitle) {
    return props.slotProps.formData.id === undefined ? props.addTitle : props.editTitle
  }
  return props.slotProps.formData.id === undefined ? $t('common.add') : $t('common.edit')
})

/**
 * 冷启动：正在加载且当前没有任何数据（且不是失败态）。
 * 这是唯一使用骨架屏的场景——有旧数据时继续用扫描线，翻页不会整表消失。
 */
/**
 * 传了 columns 才启用列配置；不传时行为与旧版完全一致。
 * useRoute 只在启用时取，避免没装 router 的场景（单测里直接 mount 壳）产生告警。
 */
const routeForColumnKey = props.columns?.length ? useRoute() : null
const columnSetting = props.columns?.length
  ? useTableColumns({
      key: props.columnKey || (routeForColumnKey?.name ? String(routeForColumnKey.name) : 'crud'),
      defaultColumns: props.columns,
    })
  : null

/** 表头拖拽调宽：把结果写进偏好，下次进入沿用 */
function handleHeaderDragEnd(_newWidth: number, _oldWidth: number, column: { property?: string }) {
  if (!columnSetting || !column?.property) return
  columnSetting.setColumnWidth(column.property, _newWidth)
}

const isColdLoading = computed(
  () =>
    props.slotProps.tableLoading &&
    props.slotProps.tableData.length === 0 &&
    !props.slotProps.tableError,
)

/** 骨架行数跟每页条数走，最多 10 行，避免 pageSize=100 时拉出一屏灰条 */
const skeletonRows = computed(() => Math.min(props.slotProps.paginationData.pageSize || 10, 10))

function handleFormSubmit() {
  formRef.value?.validate?.((valid: boolean) => {
    if (!valid) return
    submitLoading.value = true
    const isAdd = props.slotProps.formData.id === undefined
    props.slotProps.handleSubmit(isAdd).finally(() => {
      submitLoading.value = false
    })
  })
}

// 弹窗关闭时清除校验状态，让下次打开干净
watch(
  () => props.slotProps.dialogVisible,
  (val) => {
    if (!val) {
      formRef.value?.clearValidate?.()
    }
  },
)
</script>
