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
          <slot name="actions-right" v-bind="slotProps" />
        </div>
      </div>
      <div
        v-table-loading="slotProps.tableLoading"
        class="table-wrapper"
        :aria-busy="slotProps.tableLoading"
      >
        <div class="table-page-shell">
          <el-table
            v-bind="tableProps"
            :data="slotProps.tableData"
            @selection-change="slotProps.handleSelectionChange"
            @row-click="handleRowClick"
          >
            <slot name="table" v-bind="slotProps" />
            <template v-if="$slots.empty" #empty>
              <slot name="empty" />
            </template>
          </el-table>
        </div>
      </div>
      <div v-if="!hidePagination" class="page-wrapper">
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
import { useI18n } from 'vue-i18n'
import { ref, computed, watch } from 'vue'
import type { FormRules } from 'element-plus'
import type { UseCrudSlotProps } from '@@/composables/useCrud'

defineOptions({ name: 'useCrudView' })

const { t } = useI18n()
const $t = t

const props = defineProps<{
  slotProps: UseCrudSlotProps
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
