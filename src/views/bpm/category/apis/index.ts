import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type { WorkflowCategoryQueryVO, WorkflowCategoryVO } from './type'

export function workflowCategoryPage(
  data: WorkflowCategoryQueryVO,
): Promise<ResponseVO<PageData<WorkflowCategoryVO>>> {
  return request({ url: '/workflow/category/page', method: 'POST', data })
}

export function addWorkflowCategory(data: WorkflowCategoryVO): Promise<ResponseVO<number>> {
  return request({ url: '/workflow/category/add', method: 'POST', data })
}

export function modifyWorkflowCategory(data: WorkflowCategoryVO): Promise<ResponseVO<number>> {
  return request({ url: '/workflow/category/modifyById', method: 'POST', data })
}

export function removeWorkflowCategories(ids: string): Promise<ResponseVO<number>> {
  return request({ url: `/workflow/category/removeByIds/${ids}`, method: 'GET' })
}

export function workflowCategoryList(): Promise<ResponseVO<WorkflowCategoryVO[]>> {
  return request({ url: '/workflow/category/list', method: 'GET' })
}
