import { getProcessDetail, getRejectableNodes } from '../apis'
import { INSTANCE_STATUS } from '../apis/type'
import type { InstanceStatus, RejectableNodeVO, WorkflowInstanceVO } from '../apis/type'

/**
 * 审批详情的读模型。
 *
 * 抽屉里原本把「拉详情 / 拉可退回节点 / 推导当前任务」和展示混在一起，
 * 这里把数据侧收成一个模块：{ load, loadRejectableNodes, reset } 三个动作，
 * 其余都是派生的只读值。
 *
 * 依赖通过参数注入（默认走真实 api），因此测试不需要 mock HTTP。
 */

export interface ApprovalDetailApis {
  getDetail: (processInstanceId: string) => Promise<{ data?: WorkflowInstanceVO }>
  getRejectableNodes: (taskId: string) => Promise<{ data?: RejectableNodeVO[] }>
}

export interface UseApprovalDetailOptions {
  apis?: Partial<ApprovalDetailApis>
}

/** 仅「进行中 / 已驳回」允许发起人撤回 */
export function canCancelInstance(status?: InstanceStatus): boolean {
  return status === INSTANCE_STATUS.RUNNING || status === INSTANCE_STATUS.REJECTED
}

export function useApprovalDetail(
  getProcessInstanceId: () => string | undefined,
  options: UseApprovalDetailOptions = {},
) {
  const apis: ApprovalDetailApis = {
    getDetail: options.apis?.getDetail ?? ((id) => getProcessDetail(id)),
    getRejectableNodes:
      options.apis?.getRejectableNodes ?? ((taskId) => getRejectableNodes(taskId)),
  }

  const detail = ref<WorkflowInstanceVO>({})
  const loading = ref(false)

  const rejectableNodes = ref<RejectableNodeVO[]>([])
  const nodeLoading = ref(false)
  /** 已拉取过可退回节点的任务 id：同一个任务不重复请求 */
  const loadedNodeTaskId = ref<string | null>(null)

  const currentTasks = computed(() => detail.value?.currentTasks ?? [])
  const taskHistory = computed(() => detail.value?.taskHistory ?? [])
  const hasPendingTask = computed(() => currentTasks.value.length > 0)

  async function load(): Promise<void> {
    const id = getProcessInstanceId()
    if (!id) return

    loading.value = true
    try {
      const { data } = await apis.getDetail(id)
      detail.value = data ?? {}
    } catch {
      // 错误提示由 request 层统一处理，这里只保证状态复位
    } finally {
      loading.value = false
    }
  }

  /**
   * 拉取当前任务的可退回节点。
   * 已加载过同一个任务时直接用缓存 —— 抽屉里反复切换「通过/驳回」不应重复请求。
   */
  async function loadRejectableNodes(taskId: string): Promise<RejectableNodeVO[]> {
    if (!taskId) return []
    if (loadedNodeTaskId.value === taskId && rejectableNodes.value.length > 0) {
      return rejectableNodes.value
    }

    nodeLoading.value = true
    try {
      const { data } = await apis.getRejectableNodes(taskId)
      rejectableNodes.value = data ?? []
      loadedNodeTaskId.value = taskId
      return rejectableNodes.value
    } catch {
      rejectableNodes.value = []
      return []
    } finally {
      nodeLoading.value = false
    }
  }

  function reset() {
    detail.value = {}
    rejectableNodes.value = []
    loadedNodeTaskId.value = null
  }

  return {
    detail,
    loading,
    rejectableNodes,
    nodeLoading,
    currentTasks,
    taskHistory,
    hasPendingTask,
    load,
    loadRejectableNodes,
    reset,
  }
}
