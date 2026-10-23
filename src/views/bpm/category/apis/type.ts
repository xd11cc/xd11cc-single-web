export interface WorkflowCategoryQueryVO {
  categoryCode?: string
  categoryName?: string
  status?: string
  currentPage?: number
  pageSize?: number
}

export interface WorkflowCategoryVO {
  id?: number
  categoryCode?: string
  categoryName?: string
  sort?: number
  status?: string
  remark?: string
  createTime?: string
  updateTime?: string
}
