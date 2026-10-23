import request from '@@/utils/request'
import type { ResponseVO } from 'types/api'

export interface WorkflowDraft {
  id?: string
  name?: string
  key?: string
  category?: string
  description?: string
  editorSource?: string
  editorSourceExtraValue?: string
}

export interface SaveWorkflowDraftInput {
  modelId?: string
  name: string
  key: string
  category?: string
  description?: string
  editorSource: string
  editorSourceExtraValue?: string
}

export function saveWorkflowDraft(
  data: SaveWorkflowDraftInput,
): Promise<ResponseVO<WorkflowDraft>> {
  return request({ url: '/workflow/draft/save', method: 'POST', data })
}

export function getWorkflowDraft(modelId: string): Promise<ResponseVO<WorkflowDraft>> {
  return request({ url: `/workflow/draft/${modelId}`, method: 'GET' })
}

export function deployWorkflowDraft(modelId: string): Promise<ResponseVO<string>> {
  return request({ url: '/workflow/draft/deploy', method: 'POST', data: { modelId } })
}
