import { useI18n } from 'vue-i18n'
import { approveTask, cancelProcess, delegateTask, rejectTask } from '../apis'
import type { ApprovePayload, DelegatePayload, RejectPayload } from '../apis/type'

/**
 * 审批动作的写模型。
 *
 * 设计要点：
 *  1. 四个动作共享同一份「在途状态」，所以放在一个模块里，而不是按
 *     task/process 拆成两个（拆开后调用方要同时判断两个 loading）。
 *  2. 只返回结果（boolean），不替调用方关弹窗/刷新列表 —— 抽屉要 emit、
 *     列表页要 refresh，需求不同，由调用方通过 onSuccess 决定。
 *  3. 请求失败不抛错：request 层已统一提示，这里只负责复位状态。
 *  4. apis 可注入：测试传假实现即可，不需要 mock HTTP。
 */

export type ApprovalAction = 'approve' | 'reject' | 'delegate' | 'cancel'

export interface CancelPayload {
  processInstanceId: string
  reason?: string
}

export interface ApprovalApis {
  approve: (payload: ApprovePayload) => Promise<unknown>
  reject: (payload: RejectPayload) => Promise<unknown>
  delegate: (payload: DelegatePayload) => Promise<unknown>
  cancel: (payload: CancelPayload) => Promise<unknown>
}

export interface UseApprovalActionsOptions {
  /** 替换底层请求（测试用） */
  apis?: Partial<ApprovalApis>
  /** 成功后回调：关闭弹窗、刷新列表等由调用方决定 */
  onSuccess?: (action: ApprovalAction) => void | Promise<void>
}

export function useApprovalActions(options: UseApprovalActionsOptions = {}) {
  const { t } = useI18n()

  const apis: ApprovalApis = {
    approve: options.apis?.approve ?? ((payload) => approveTask(payload as ApprovePayload)),
    reject: options.apis?.reject ?? ((payload) => rejectTask(payload as RejectPayload)),
    delegate: options.apis?.delegate ?? ((payload) => delegateTask(payload as DelegatePayload)),
    cancel:
      options.apis?.cancel ??
      ((payload) => cancelProcess(payload.processInstanceId, payload.reason)),
  }

  const submitting = ref(false)
  const pendingAction = ref<ApprovalAction | null>(null)

  /**
   * 统一的提交流程：前置校验 → 提交态 → 请求 → 成功提示 → 复位。
   * 已经在提交中时直接返回 false，天然防重复点击。
   */
  async function run(
    action: ApprovalAction,
    validate: () => string | null,
    execute: () => Promise<unknown>,
  ): Promise<boolean> {
    if (pendingAction.value) return false

    const warning = validate()
    if (warning) {
      ElMessage.warning(warning)
      return false
    }

    submitting.value = true
    pendingAction.value = action
    try {
      await execute()
      ElMessage.success(t('common.messages.operationSuccess'))
      await options.onSuccess?.(action)
      return true
    } catch {
      // 错误提示由 request 层统一处理，这里只保证状态复位
      return false
    } finally {
      submitting.value = false
      pendingAction.value = null
    }
  }

  const approve = (payload: ApprovePayload) =>
    run(
      'approve',
      () => (payload?.taskId ? null : t('bpm.approval.messages.missingTask')),
      () => apis.approve(payload),
    )

  const reject = (payload: RejectPayload) =>
    run(
      'reject',
      () => {
        if (!payload?.taskId) return t('bpm.approval.messages.missingTask')
        if (!payload.targetActivityId) return t('bpm.approval.messages.selectTargetNode')
        return null
      },
      () => apis.reject(payload),
    )

  const delegate = (payload: DelegatePayload) =>
    run(
      'delegate',
      () => {
        if (!payload?.taskId) return t('bpm.approval.messages.missingTask')
        if (!payload.targetUserId) return t('bpm.approval.messages.inputTargetUser')
        return null
      },
      () => apis.delegate(payload),
    )

  const cancel = (payload: CancelPayload) =>
    run(
      'cancel',
      () => (payload?.processInstanceId ? null : t('bpm.approval.messages.missingTask')),
      () => apis.cancel(payload),
    )

  return { approve, reject, delegate, cancel, submitting, pendingAction }
}
