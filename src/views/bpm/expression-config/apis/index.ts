import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type { WorkflowExpressionConfigQueryVO, WorkflowExpressionConfigVO } from './type'

type WorkflowExpressionConfigPageQuery = WorkflowExpressionConfigQueryVO & {
  currentPage?: number
  pageSize?: number
}

export function expressionConfigPage(
  data: WorkflowExpressionConfigPageQuery,
): Promise<ResponseVO<PageData<WorkflowExpressionConfigVO>>> {
  return request({ url: '/workflow/expression-config/page', method: 'POST', data })
}

export function addExpressionConfig(data: WorkflowExpressionConfigVO): Promise<ResponseVO<number>> {
  return request({ url: '/workflow/expression-config/add', method: 'POST', data })
}

export function modifyExpressionConfig(
  data: WorkflowExpressionConfigVO,
): Promise<ResponseVO<number>> {
  return request({ url: '/workflow/expression-config/modifyById', method: 'POST', data })
}

export function removeExpressionConfig(ids: string): Promise<ResponseVO<number>> {
  return request({ url: `/workflow/expression-config/removeByIds/${ids}`, method: 'GET' })
}

export function getExpressionConfigOptions(
  expressionType: string,
): Promise<ResponseVO<WorkflowExpressionConfigVO[]>> {
  return request({
    url: '/workflow/expression-config/options',
    method: 'GET',
    params: { expressionType },
  })
}
