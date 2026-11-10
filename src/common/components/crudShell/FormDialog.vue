<!-- 新增/修改弹窗：列表壳与树形壳共用，保证两边的提交行为完全一致 -->
<template>
  <el-dialog
    v-if="!readonly"
    v-model="visible"
    :title="dialogTitle"
    :width="dialogWidth || 'min(760px, calc(100vw - 32px))'"
    destroy-on-close
    @close="slotProps.handleClose"
  >
    <!-- 弹窗内提示条（如「权限加载失败，已阻止保存」）：让用户知道为什么不能提交 -->
    <slot name="banner" v-bind="slotProps" />

    <el-form
      ref="formRef"
      class="adaptive-form"
      :model="slotProps.formData"
      :rules="formRules"
      :label-width="labelWidth"
      :label-position="labelPosition"
    >
      <el-row :gutter="20">
        <slot v-bind="slotProps" />
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="slotProps.handleClose">{{ $t('common.cancel') }}</el-button>
      <el-button
        type="primary"
        :loading="submitLoading"
        :disabled="submitDisabled"
        @click="handleFormSubmit"
      >
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup generic="T extends CrudDialogSlotProps">
import { computed, onScopeDispose, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import type { CrudDialogSlotProps } from '@@/composables/crud-types'

/**
 * CRUD 弹窗（两个壳共用）。
 *
 * 校验是异步的，而按钮 loading 要等校验通过才置上，这段时间里的再次提交、
 * 以及校验返回前关掉弹窗，都会带着旧的 formData 提交。因此用会话号
 * （`slotProps.sessionId`，由 useCrud/useTreeCrud 维护）标记弹窗生命周期：
 * 回调回来时若会话已变或表单对象已换，就丢弃这次提交。
 */

const props = withDefaults(
  defineProps<{
    slotProps: T
    /** 新增/修改共用表单校验规则；只读列表可不传 */
    formRules?: FormRules
    /** 弹窗标题，不传则按新增/修改自动取 i18n 文案 */
    addTitle?: string
    editTitle?: string
    /** 只读列表：不渲染弹窗 */
    readonly?: boolean
    dialogWidth?: string
    labelWidth?: string
    labelPosition?: 'left' | 'right' | 'top'
    /** 禁止提交（依赖数据未就绪时用） */
    submitDisabled?: boolean
  }>(),
  {
    readonly: false,
    labelWidth: '168px',
    labelPosition: 'left',
  },
)

const { t } = useI18n()
const $t = t

const formRef = ref<FormInstance>()
const submitLoading = ref(false)

let isDisposed = false

onScopeDispose(() => {
  isDisposed = true
})

/** 代理 dialogVisible 的读写，对外行为与直接 v-model 到 slotProps 一致 */
const visible = computed({
  get: () => props.slotProps.dialogVisible,
  set: (val: boolean) => {
    props.slotProps.dialogVisible = val
  },
})

const dialogTitle = computed(() => {
  const isAdd = props.slotProps.formData?.id === undefined
  if (props.addTitle && props.editTitle) return isAdd ? props.addTitle : props.editTitle
  return isAdd ? $t('common.add') : $t('common.edit')
})

async function handleFormSubmit() {
  const form = formRef.value
  // 已在提交中、已销毁、弹窗已关或表单不存在时，这次点击不再发起提交
  if (
    isDisposed ||
    submitLoading.value ||
    props.submitDisabled ||
    !props.slotProps.dialogVisible ||
    !form
  ) {
    return
  }

  const formData = props.slotProps.formData
  // 会话号来自 useCrud/useTreeCrud，与页面层回填用的是同一份
  const sessionId = props.slotProps.sessionId
  submitLoading.value = true
  try {
    // el-form 不传回调时返回 Promise；校验失败会 reject，用 catch 收住
    const valid = await form.validate?.()
    // 2) 校验回来时再确认一次：会话没变、弹窗还开着、表单还是同一个对象
    if (
      !valid ||
      isDisposed ||
      sessionId !== props.slotProps.sessionId ||
      !props.slotProps.dialogVisible ||
      formData !== props.slotProps.formData
    ) {
      return
    }
    const isAdd = formData?.id === undefined
    await props.slotProps.handleSubmit(isAdd)
  } catch {
    // 校验未通过 / 提交被拒绝：request 层已提示，这里只需恢复按钮
    return
  } finally {
    if (!isDisposed) submitLoading.value = false
  }
}

/**
 * 关闭后清校验，下次打开是干净的。
 * 会话号由 useCrud 的 handleClose 递增，无需在这里再维护一份。
 */
watch(
  () => props.slotProps.dialogVisible,
  (val) => {
    if (!val) formRef.value?.clearValidate?.()
  },
  { flush: 'sync' },
)
</script>
