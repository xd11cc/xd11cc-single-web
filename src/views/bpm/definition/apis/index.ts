import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type {
  WorkflowDefinitionQueryVO,
  WorkflowDefinitionVersionVO,
  WorkflowDefinitionVO,
} from './type'

export function getDefinitionPage(
  data: WorkflowDefinitionQueryVO,
): Promise<ResponseVO<PageData<WorkflowDefinitionVO>>> {
  return request({
    url: '/workflow/definition/page',
    method: 'POST',
    data,
  })
}

export function removeWorkflowDraft(modelId: string): Promise<ResponseVO<void>> {
  return request({
    url: `/workflow/draft/${modelId}`,
    method: 'DELETE',
  })
}

export function suspendWorkflowDefinition(processDefinitionId: string): Promise<ResponseVO<void>> {
  return request({
    url: '/workflow/definition/suspend',
    method: 'POST',
    params: { processDefinitionId },
  })
}

export function activateWorkflowDefinition(processDefinitionId: string): Promise<ResponseVO<void>> {
  return request({
    url: '/workflow/definition/activate',
    method: 'POST',
    params: { processDefinitionId },
  })
}

export function getWorkflowDefinitionVersions(
  key: string,
): Promise<ResponseVO<WorkflowDefinitionVersionVO[]>> {
  return request({ url: '/workflow/definition/versions', method: 'GET', params: { key } })
}
