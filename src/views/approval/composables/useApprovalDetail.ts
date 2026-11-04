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
  const loadError = ref(false)
  const loadedProcessInstanceId = ref<string | null>(null)

  const rejectableNodes = ref<RejectableNodeVO[]>([])
  const nodeLoading = ref(false)
  /** 已拉取过可退回节点的任务 id：同一个任务不重复请求 */
  const loadedNodeTaskId = ref<string | null>(null)
  const loadedNodeProcessInstanceId = ref<string | null>(null)
  let detailRequestId = 0
  let nodeRequestId = 0
  let activeProcessInstanceId: string | null = null
  let isDisposed = false

  const currentTasks = computed(() => detail.value?.currentTasks ?? [])
  const taskHistory = computed(() => detail.value?.taskHistory ?? [])
  const hasPendingTask = computed(() => currentTasks.value.length > 0)
  const detailReady = computed(() => {
    const id = getProcessInstanceId()
    return Boolean(
      !isDisposed &&
        id &&
        !loading.value &&
        !loadError.value &&
        loadedProcessInstanceId.value === id &&
        detail.value.processInstanceId === id,
    )
  })

  function ensureContext(id: string | undefined) {
    const nextId = id || null
    if (activeProcessInstanceId !== nextId) {
      reset()
      activeProcessInstanceId = nextId
    }
  }

  async function load(): Promise<void> {
    if (isDisposed) return
    const id = getProcessInstanceId()
    ensureContext(id)
    if (!id) return

    const requestId = ++detailRequestId
    const isCurrent = () =>
      !isDisposed && requestId === detailRequestId && id === getProcessInstanceId()
    detail.value = {}
    loadedProcessInstanceId.value = null
    loadError.value = false
    loading.value = true
    try {
      const { data } = await apis.getDetail(id)
      if (!isCurrent()) return
      if (data?.processInstanceId !== id) {
        loadError.value = true
        return
      }
      detail.value = data
      loadedProcessInstanceId.value = id
    } catch {
      if (isCurrent()) loadError.value = true
    } finally {
      if (isCurrent()) loading.value = false
    }
  }

  /**
   * 拉取当前任务的可退回节点。
   * 已加载过同一个任务时直接用缓存 —— 抽屉里反复切换「通过/驳回」不应重复请求。
   */
  async function loadRejectableNodes(taskId: string): Promise<RejectableNodeVO[]> {
    if (isDisposed) return []
    const id = getProcessInstanceId()
    ensureContext(id)
    if (!id || !taskId) {
      resetNodes()
      return []
    }
    if (areNodesReady(taskId)) {
      return rejectableNodes.value
    }

    resetNodes()
    const requestId = nodeRequestId
    const isCurrent = () =>
      !isDisposed && requestId === nodeRequestId && id === getProcessInstanceId()
    nodeLoading.value = true
    try {
      const { data } = await apis.getRejectableNodes(taskId)
      if (!isCurrent()) return []
      rejectableNodes.value = data ?? []
      loadedNodeTaskId.value = taskId
      loadedNodeProcessInstanceId.value = id
      return rejectableNodes.value
    } catch {
      return []
    } finally {
      if (isCurrent()) nodeLoading.value = false
    }
  }

  function areNodesReady(taskId: string): boolean {
    const id = getProcessInstanceId()
    return Boolean(
      !isDisposed &&
        id &&
        taskId &&
        !nodeLoading.value &&
        loadedNodeTaskId.value === taskId &&
        loadedNodeProcessInstanceId.value === id,
    )
  }

  function resetNodes() {
    nodeRequestId++
    rejectableNodes.value = []
    loadedNodeTaskId.value = null
    loadedNodeProcessInstanceId.value = null
    nodeLoading.value = false
  }

  function reset() {
    detailRequestId++
    resetNodes()
    detail.value = {}
    loadedProcessInstanceId.value = null
    loadError.value = false
    loading.value = false
    activeProcessInstanceId = null
  }

  onScopeDispose(() => {
    isDisposed = true
    reset()
  })

  return {
    detail,
    loading,
    loadError,
    detailReady,
    rejectableNodes,
    nodeLoading,
    currentTasks,
    taskHistory,
    hasPendingTask,
    load,
    loadRejectableNodes,
    areNodesReady,
    reset,
  }
}
