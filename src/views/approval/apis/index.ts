import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type {
  ActivityVO,
  ApprovePayload,
  DelegatePayload,
  MyStartedQuery,
  MyTaskQuery,
  RejectPayload,
  RejectableNodeVO,
  WorkflowInstanceVO,
  WorkflowTaskVO,
} from './type'

// ==================== 我发起的 ====================

/** 我发起的流程列表 */
export function getMyStartedProcesses(
  data: MyStartedQuery,
): Promise<ResponseVO<PageData<WorkflowInstanceVO>>> {
  return request({ url: '/workflow/process/mine', method: 'POST', data })
}

/** 流程实例详情（含审批历史 + 当前活动任务） */
export function getProcessDetail(
  processInstanceId: string,
): Promise<ResponseVO<WorkflowInstanceVO>> {
  return request({ url: `/workflow/process/${processInstanceId}`, method: 'GET' })
}

/** 撤回流程（仅发起人） */
export function cancelProcess(
  processInstanceId: string,
  reason?: string,
): Promise<ResponseVO<void>> {
  return request({
    url: '/workflow/process/cancel',
    method: 'POST',
    params: { processInstanceId, reason },
  })
}

/** 流程轨迹（历史活动节点，分页） */
export function getHistoricActivities(
  processInstanceId: string,
  pageNo = 1,
  pageSize = 50,
): Promise<ResponseVO<PageData<ActivityVO>>> {
  return request({
    url: '/workflow/process/activities',
    method: 'POST',
    params: { processInstanceId, pageNo, pageSize },
  })
}

// ==================== 我的审批 / 我已审批 ====================

/** 我的待办 */
export function getMyTodoTasks(
  data: MyTaskQuery,
): Promise<ResponseVO<PageData<WorkflowTaskVO>>> {
  return request({ url: '/workflow/task/todo', method: 'POST', data })
}

/** 我的已办 */
export function getMyDoneTasks(
  data: MyTaskQuery,
): Promise<ResponseVO<PageData<WorkflowTaskVO>>> {
  return request({ url: '/workflow/task/done', method: 'POST', data })
}

/** 审批通过 */
export function approveTask(data: ApprovePayload): Promise<ResponseVO<void>> {
  return request({ url: '/workflow/task/approve', method: 'POST', data })
}

/** 驳回（退回到指定节点） */
export function rejectTask(data: RejectPayload): Promise<ResponseVO<void>> {
  return request({ url: '/workflow/task/reject', method: 'POST', data })
}

/** 转办 */
export function delegateTask(data: DelegatePayload): Promise<ResponseVO<void>> {
  return request({ url: '/workflow/task/delegate', method: 'POST', data })
}

/** 获取当前任务可退回节点 */
export function getRejectableNodes(
  taskId: string,
): Promise<ResponseVO<RejectableNodeVO[]>> {
  return request({ url: '/workflow/task/rejectable-nodes', method: 'GET', params: { taskId } })
}
