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
        <div>
          <slot name="actions" v-bind="slotProps" />
        </div>
      </div>
      <div class="table-wrapper" :aria-busy="slotProps.tableLoading">
        <div class="table-page-shell">
          <el-table :data="slotProps.tableData" @selection-change="slotProps.handleSelectionChange">
            <slot name="table" v-bind="slotProps" />
          </el-table>
        </div>
        <div
          class="table-loading-mask"
          :class="{ 'is-active': slotProps.tableLoading }"
          role="status"
          :aria-label="$t('common.loading')"
          aria-live="polite"
        ></div>
      </div>
      <div class="page-wrapper">
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
      v-model="slotProps.dialogVisible"
      :title="dialogTitle"
      width="min(760px, calc(100vw - 32px))"
      destroy-on-close
      @close="slotProps.handleClose"
    >
      <el-form
        ref="formRef"
        class="adaptive-form"
        :model="slotProps.formData"
        :rules="formRules"
        label-width="168px"
        label-position="left"
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
  /** 新增/修改共用表单校验规则，由父组件传入 */
  formRules: FormRules
  /** 弹窗标题，不传则自动根据新增/修改生成 */
  addTitle?: string
  editTitle?: string
}>()

const formRef = ref<any>(null)
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

<style scoped>
.table-page-shell {
  min-height: 120px;
}

.table-wrapper {
  position: relative;
}

.table-loading-mask {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: color-mix(in srgb, var(--theme-bg-surface) 92%, transparent);
  backdrop-filter: blur(0.5px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
}

.table-loading-mask::before {
  position: absolute;
  top: 0;
  left: -35%;
  width: 35%;
  height: 2px;
  content: '';
  background: linear-gradient(
    90deg,
    transparent,
    var(--theme-accent),
    color-mix(in srgb, var(--theme-accent) 35%, transparent),
    transparent
  );
  opacity: 0;
  transform: translateX(0);
}

.table-loading-mask.is-active {
  opacity: 1;
  pointer-events: auto;
}

.table-loading-mask.is-active::before {
  opacity: 1;
  animation: table-loading-sweep 1.15s var(--p-ease-in-out) infinite;
}

@keyframes table-loading-sweep {
  to {
    transform: translateX(385%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .table-loading-mask {
    transition: none;
  }

  .table-loading-mask.is-active::before {
    animation: none;
  }
}
</style>
