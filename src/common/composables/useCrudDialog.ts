import { onScopeDispose, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { ResponseVO } from 'types/api'

/**
 * 列表壳与树形壳共用的「弹窗生命周期」。
 *
 * 抽出来的原因：为了修「旧响应把新弹窗关掉 / 覆盖新表单」这类问题，两个壳各自
 * 加了一套会话号、提交守卫和删除确认，结果是同一段逻辑维护两份、逐渐分叉
 * （历史上就出现过「树形壳有保护、列表壳没有」）。这里统一成一份。
 *
 * 只包含两边真正相同的部分：
 *  - 弹窗开关状态与表单对象
 *  - 会话号（打开/关闭/销毁都会变）
 *  - 提交：成功提示、仅在会话未变时关闭、成功后刷新
 *  - 删除确认：统一的确认框与取消处理
 *
 * 各壳不同的地方（分页 / 树 / parentRow / removeApi 形态）仍留在各自文件里。
 */

/** 弹窗打开回调的上下文：各壳再补自己的字段（row / parent） */
export interface CrudDialogOpenContext {
  isAdd: boolean
  form: Record<string, any>
  session: number
  [key: string]: unknown
}

export interface UseCrudDialogOptions {
  /** 新增/修改共用默认表单 */
  defaultForm?: () => Record<string, any>
  addApi?: (data: any) => Promise<ResponseVO<any>>
  updateApi?: (data: any) => Promise<ResponseVO<any>>
  /** 提交前把表单转成接口载荷 */
  transformPayload?: (form: any, isAdd: boolean) => any
  /** 打开弹窗后的钩子（上下文里带会话号） */
  onDialogOpen?: (context: CrudDialogOpenContext) => void
}

export interface UseCrudDialogSubmitHooks {
  /** 作用域是否已销毁（用于「销毁后不再提示/不再刷新」） */
  isDisposed?: () => boolean
  /** 关窗时清理各壳自己的附加状态（如 parentRow） */
  onClosed?: () => void
  /** 提交成功后的刷新动作 */
  afterSuccess?: () => void | Promise<void>
}

export function useCrudDialog<T = any>(options: UseCrudDialogOptions) {
  const { t } = useI18n()

  const dialogVisible = ref(false)
  const formData = ref<any>(options.defaultForm?.() || {})
  const dialogSessionId = ref(0)
  const submitLoading = ref(false)
  /** 各壳的附加状态（树形壳用来挂 parentRow），不参与共享逻辑 */
  const extraRow = ref<T | null>(null)

  onScopeDispose(() => {
    // 销毁即作废所有在途回填
    dialogSessionId.value++
  })

  /** 当前弹窗会话号（打开/关闭都会变） */
  const sessionId = () => dialogSessionId.value
  /** 该会话号是否仍是当前弹窗 */
  const isCurrentSession = (session: number) => session === dialogSessionId.value

  /**
   * 打开弹窗。
   * @param form 表单对象
   * @param isAdd 是否新增（各壳判定方式不同，由调用方传入）
   * @param extraContext 追加到回调上下文里的字段（如 row / parent）
   */
  function openDialog(
    form: Record<string, any>,
    isAdd: boolean,
    extraContext: Record<string, unknown> = {},
    row: unknown = null,
  ) {
    dialogSessionId.value++
    formData.value = form
    extraRow.value = row as T | null
    dialogVisible.value = true
    // 必须回读 formData.value：ref 会把对象转成响应式代理，
    // 直接把入参放进上下文会与 `state.formData.value` 不是同一个引用，
    // 页面里「表单对象未变」的判定就会失效。
    const currentForm = formData.value as Record<string, any>
    options.onDialogOpen?.({
      isAdd,
      form: currentForm,
      session: dialogSessionId.value,
      ...extraContext,
    })
  }

  /** 关闭弹窗：会话号自增，使所有在途回调失效 */
  function closeDialog() {
    dialogSessionId.value++
    formData.value = options.defaultForm?.() || {}
    extraRow.value = null
    dialogVisible.value = false
  }

  /**
   * 提交。
   *
   * 关键点：成功回调里只有「会话号没变」时才关窗——请求期间用户可能已经关掉
   * 弹窗、甚至打开了另一条记录的编辑框，无条件关窗会把新弹窗一起关掉。
   */
  async function submit(
    isAdd: boolean,
    hooks: UseCrudDialogSubmitHooks = {},
  ): Promise<ResponseVO<any> | void> {
    const { isDisposed, onClosed, afterSuccess } = hooks
    // 提交进行中：避免上一次请求没回来时重复发起
    if (submitLoading.value) return
    if (isDisposed?.()) return
    const api = isAdd ? options.addApi : options.updateApi
    if (!api) return

    const sessionIdAtSubmit = dialogSessionId.value
    submitLoading.value = true
    try {
      const payload = options.transformPayload?.(formData.value, isAdd) ?? { ...formData.value }
      const res = await api(payload)
      if (isDisposed?.()) return res

      ElMessage.success(res.msg || t('common.messages.operationSuccess'))
      if (sessionIdAtSubmit === dialogSessionId.value) {
        dialogVisible.value = false
        onClosed?.()
      }
      await afterSuccess?.()
      return res
    } catch {
      // request 层已提示错误；这里收口 rejection，避免事件处理器留下未处理异常
      return
    } finally {
      submitLoading.value = false
    }
  }

  /**
   * 删除前的确认框。
   * @returns 用户是否确认（取消或异常都返回 false，调用方直接 return 即可）
   */
  async function confirmRemove(text: string): Promise<boolean> {
    try {
      await ElMessageBox.confirm(text, t('common.messages.confirmTitle'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      })
      return true
    } catch {
      // 用户取消时 ElMessageBox 会 reject；取消不是错误
      return false
    }
  }

  /** 供各壳装配 slotProps / state 使用 */
  const state = {
    formData,
    dialogVisible,
    /** 当前弹窗会话号 */
    get sessionId() {
      return dialogSessionId.value
    },
    isCurrentSession,
  }

  return {
    dialogVisible,
    formData,
    submitLoading,
    sessionId,
    isCurrentSession,
    /** 各壳的附加行（树形壳用 parentRow） */
    extraRow,
    openDialog,
    closeDialog,
    submit,
    confirmRemove,
    state,
  }
}
