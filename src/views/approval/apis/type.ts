/**
 * 工作流审批相关类型定义
 *
 * 数据来源说明：
 *  - 「我发起的」→ workflow_instance（业务库）
 *  - 「我的审批」→ Flowable 运行时 ACT_RU_TASK（含候选人/候选组）
 *  - 「我已审批」→ Flowable 历史 ACT_HI_TASKINST
 */

/** 通用分页查询参数 */
export interface ApprovalPageQuery {
  currentPage?: number
  pageSize?: number
  processDefinitionKey?: string
  title?: string
}

/** 「我发起的」查询参数 */
export interface MyStartedQuery extends ApprovalPageQuery {
  /** 0-进行中 1-已完成 2-已取消 3-已驳回 */
  status?: number
}

/** 「我的审批 / 我已审批」查询参数 */
export type MyTaskQuery = ApprovalPageQuery

/** 流程实例状态 */
export type InstanceStatus = 0 | 1 | 2 | 3

/** 任务明细（待办/已办通用） */
export interface WorkflowTaskVO {
  taskId?: string
  taskName?: string
  taskDefinitionKey?: string
  assignee?: string | null
  assigneeName?: string | null
  processInstanceId?: string
  processDefinitionKey?: string | null
  businessKey?: string | null
  title?: string | null
  comment?: string | null
  commentType?: string | null
  createTime?: string
  endTime?: string | null
}

/** 流程实例明细（我发起的） */
export interface WorkflowInstanceVO {
  processInstanceId?: string
  processDefinitionKey?: string
  businessKey?: string
  title?: string
  status?: InstanceStatus
  starterUserId?: number
  starterUsername?: string
  createTime?: string
  endTime?: string | null
  taskHistory?: WorkflowTaskVO[]
  currentTasks?: WorkflowTaskVO[]
}

/** 审批提交参数 */
export interface ApprovePayload {
  taskId: string
  comment?: string
  variables?: Record<string, unknown>
}

/** 驳回提交参数 */
export interface RejectPayload {
  taskId: string
  targetActivityId: string
  comment?: string
}

/** 转办提交参数 */
export interface DelegatePayload {
  taskId: string
  targetUserId: string
  comment?: string
}

/** 可退回节点 */
export interface RejectableNodeVO {
  activityId?: string
  activityName?: string
  isStartNode?: boolean
}
