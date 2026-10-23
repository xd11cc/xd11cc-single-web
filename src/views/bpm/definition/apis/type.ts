export interface WorkflowDefinitionQueryVO {
  name?: string
  key?: string
  category?: string
  currentPage?: number
  pageSize?: number
}

export interface WorkflowDefinitionVO {
  id?: string
  deploymentId?: string
  processDefinitionId?: string
  key?: string
  name?: string
  version?: number
  category?: string
  deployTime?: string
  suspended?: boolean
  /** DRAFT-草稿、SUSPENDED-挂起、ACTIVE-激活、CONFLICT-异常 */
  status?: 'DRAFT' | 'SUSPENDED' | 'ACTIVE' | 'CONFLICT'
}

export interface WorkflowDefinitionVersionVO {
  processDefinitionId?: string
  deploymentId?: string
  key?: string
  name?: string
  category?: string
  version?: number
  status?: 'SUSPENDED' | 'ACTIVE' | 'CONFLICT'
  suspended?: boolean
  deployTime?: string
}
