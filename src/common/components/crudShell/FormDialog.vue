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
      :disabled="formDisabled"
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
        :loading="isSubmitting"
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
    /** 回填期间禁用整张表单，避免用户输入被迟到响应覆盖 */
    formDisabled?: boolean
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
/**
 * 正在提交的会话号（null 表示没有提交在途）。
 *
 * 用会话号而不是布尔值，是为了让锁的作用域与会话一致：
 * 用户关掉弹窗再打开另一条记录后，新会话不应继承上一个会话的 loading 与阻塞。
 */
const lockedSession = ref<number | null>(null)
/** 当前会话是否正在提交（决定按钮 loading） */
const isSubmitting = computed(() => lockedSession.value === props.slotProps.sessionId)

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
    isSubmitting.value ||
    props.submitDisabled ||
    !props.slotProps.dialogVisible ||
    !form
  ) {
    return
  }

  const formData = props.slotProps.formData
  // 会话号来自 useCrudDialog，与页面层回填用的是同一份
  const sessionId = props.slotProps.sessionId
  lockedSession.value = sessionId
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
    // 只解自己这把锁：期间可能已经开了新会话，不能把别人的锁清掉
    if (lockedSession.value === sessionId) lockedSession.value = null
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
