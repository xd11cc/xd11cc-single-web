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
            <template #icon><Icon icon="lucide:search" /></template>查询
          </el-button>
          <el-button @click="slotProps.resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区 -->
    <el-card v-loading="slotProps.tableLoading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <slot name="actions" v-bind="slotProps" />
        </div>
      </div>
      <div class="table-wrapper">
        <el-table
          :data="slotProps.tableData"
          @selection-change="slotProps.handleSelectionChange"
        >
          <slot name="table" v-bind="slotProps" />
        </el-table>
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
      width="40%"
      destroy-on-close
      @close="slotProps.handleClose"
    >
      <el-form
        ref="formRef"
        :model="slotProps.formData"
        :rules="formRules"
        label-width="80px"
        label-position="left"
      >
        <el-row :gutter="20">
          <slot name="form-fields" v-bind="slotProps" />
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="slotProps.handleClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleFormSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { ref, computed, watch } from 'vue'
import type { FormRules } from 'element-plus'
import type { UseCrudSlotProps } from '@@/composables/useCrud'

defineOptions({ name: 'useCrudView' })

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
  return props.slotProps.formData.id === undefined ? '新增' : '修改'
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
