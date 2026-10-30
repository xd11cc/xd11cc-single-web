import type { ApprovalConfig, ApprovalMode } from './types'
import { parseJsonArray, parseJsonObject } from './listener-io'

/**
 * 属性面板的「元素读写桥」。
 *
 * bpmn-js 的业务对象（businessObject）是 moddle 实例，读取靠 `get('flowable:xxx')`，
 * 写入靠向父组件发事件（父组件再调 modeling.updateProperties）。这套约定原先散在
 * PropertyPanel 的 10 个函数里，这里统一成：一个 form 镜像 + 一个 update 入口。
 *
 * 面板组件只关心 `form.xxx` 和 `update('name')`，不需要知道前缀、分隔符、JSON 序列化。
 */

export type ProcessVariable = {
  key: string
  name: string
}

export interface ElementFormState {
  id: string
  name: string
  category: string
  description: string
  assignee: string
  candidateUsers: string[]
  candidateGroups: string[]
  formKey: string
  approvalMode: ApprovalMode
  collection: string
  elementVariable: string
  serviceClass: string
  delegateExpression: string
  condition: string
  conditionConfigKey: string
  conditionParameters: Record<string, any>
  collectionConfigKey: string
  collectionParameters: Record<string, any>
  assigneeConfigKey: string
  assigneeParameters: Record<string, any>
  serviceExpressionConfigKey: string
  serviceExpressionParameters: Record<string, any>
}

export interface ElementFormEmit {
  update: (properties: Record<string, unknown>) => void
  updateApproval?: (config: ApprovalConfig) => void
}

/** 逗号分隔的候选值 */
export function parseCandidateValues(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * 从元素上读出审批模式。
 * 老流程没有 flowable:approvalMode 扩展属性，需要从 loopCharacteristics 反推：
 * 有会签完成条件（nrOfCompletedInstances > 0）视为或签，其余并行多实例视为会签。
 */
export function readApprovalMode(businessObject: any): ApprovalMode {
  const savedMode = businessObject?.get?.('flowable:approvalMode')
  if (['single', 'countersign', 'orsign'].includes(savedMode)) return savedMode

  const loop = businessObject?.loopCharacteristics
  if (!loop) return 'single'
  return loop.completionCondition?.body?.includes('nrOfCompletedInstances > 0')
    ? 'orsign'
    : 'countersign'
}

/** 向上找到所属的流程根节点（流程变量挂在它身上） */
export function findProcessBusinessObject(businessObject: any) {
  let current = businessObject
  while (current && current.$type !== 'bpmn:Process') current = current.$parent
  return current
}

export function useElementForm(getElement: () => any, emit: ElementFormEmit) {
  const form = reactive<ElementFormState>({
    id: '',
    name: '',
    category: '',
    description: '',
    assignee: '',
    candidateUsers: [],
    candidateGroups: [],
    formKey: '',
    approvalMode: 'single',
    collection: '${approverList}',
    elementVariable: 'approver',
    serviceClass: '',
    delegateExpression: '',
    condition: '',
    conditionConfigKey: '',
    conditionParameters: {},
    collectionConfigKey: '',
    collectionParameters: {},
    assigneeConfigKey: '',
    assigneeParameters: {},
    serviceExpressionConfigKey: '',
    serviceExpressionParameters: {},
  })

  /** 流程变量：挂在流程根节点上，面板里用于表达式的变量提示 */
  const processVariables = ref<ProcessVariable[]>([])

  function syncFromElement(element: any) {
    const businessObject = element?.businessObject

    form.id = businessObject?.id ?? ''
    form.name = businessObject?.name ?? ''
    form.category = businessObject?.get?.('flowable:category') ?? ''
    form.description = businessObject?.documentation?.[0]?.text ?? ''

    const processObject = findProcessBusinessObject(businessObject)
    processVariables.value = parseJsonArray<ProcessVariable>(
      processObject?.get?.('flowable:variables'),
    )

    form.assignee = businessObject?.get?.('flowable:assignee') ?? ''
    form.assigneeConfigKey = businessObject?.get?.('flowable:assigneeExpressionConfigKey') ?? ''
    form.assigneeParameters = parseJsonObject(
      businessObject?.get?.('flowable:assigneeExpressionParameters'),
    )
    form.candidateUsers = parseCandidateValues(businessObject?.get?.('flowable:candidateUsers'))
    form.candidateGroups = parseCandidateValues(businessObject?.get?.('flowable:candidateGroups'))
    form.formKey = businessObject?.get?.('flowable:formKey') ?? ''

    const loopCharacteristics = businessObject?.loopCharacteristics
    form.approvalMode = readApprovalMode(businessObject)
    form.collection = loopCharacteristics?.get?.('flowable:collection') ?? '${approverList}'
    form.elementVariable = loopCharacteristics?.get?.('flowable:elementVariable') ?? 'approver'
    form.collectionConfigKey = loopCharacteristics?.get?.('flowable:expressionConfigKey') ?? ''
    form.collectionParameters = parseJsonObject(
      loopCharacteristics?.get?.('flowable:expressionParameters'),
    )

    form.serviceClass = businessObject?.get?.('flowable:class') ?? ''
    form.delegateExpression = businessObject?.get?.('flowable:delegateExpression') ?? ''
    form.serviceExpressionConfigKey = businessObject?.get?.('flowable:expressionConfigKey') ?? ''
    form.serviceExpressionParameters = parseJsonObject(
      businessObject?.get?.('flowable:expressionParameters'),
    )

    form.condition = businessObject?.conditionExpression?.body ?? ''
    form.conditionConfigKey = businessObject?.get?.('flowable:expressionConfigKey') ?? ''
    form.conditionParameters = parseJsonObject(
      businessObject?.get?.('flowable:expressionParameters'),
    )
  }

  // immediate：面板挂载时立刻同步一次，避免所有字段先空一拍
  watch(getElement, syncFromElement, { immediate: true })

  /** 通用字段写入：面板里的 v-model 变化都走这里 */
  function update(property: string) {
    const fieldMap: Record<string, keyof ElementFormState> = {
      id: 'id',
      name: 'name',
      'flowable:category': 'category',
      'flowable:formKey': 'formKey',
      'flowable:class': 'serviceClass',
      'flowable:delegateExpression': 'delegateExpression',
    }
    const key = fieldMap[property]
    if (!key) return
    const value = form[key]
    emit.update({
      [property]: Array.isArray(value) ? value.join(',') || undefined : value || undefined,
    })
  }

  function updateProcessDescription() {
    emit.update({ documentationText: form.description || undefined })
  }

  function updateCandidateUsers() {
    emit.update({
      'flowable:candidateUsers': form.candidateUsers.join(',') || undefined,
      'flowable:candidateUsersExpressionConfigKey': undefined,
      'flowable:candidateUsersExpressionParameters': undefined,
    })
  }

  function updateCandidateGroups() {
    emit.update({
      'flowable:candidateGroups': form.candidateGroups.join(',') || undefined,
      'flowable:candidateGroupsExpressionConfigKey': undefined,
      'flowable:candidateGroupsExpressionParameters': undefined,
    })
  }

  function updateApprovalConfig() {
    emit.updateApproval?.({
      mode: form.approvalMode,
      collection: form.collection,
      elementVariable: 'approver',
      expressionConfigKey: form.collectionConfigKey || undefined,
      expressionParameters: form.collectionParameters,
    })
  }

  function changeApprovalMode(mode: ApprovalMode) {
    form.approvalMode = mode
    if (mode !== 'single' && !form.collection) form.collection = '${approverList}'
    if (mode !== 'single') form.elementVariable = 'approver'
    updateApprovalConfig()
  }

  function updateCondition() {
    emit.update({
      conditionExpression: form.condition
        ? { $type: 'bpmn:FormalExpression', body: form.condition }
        : undefined,
      'flowable:expressionConfigKey': form.conditionConfigKey || undefined,
      'flowable:expressionParameters': form.conditionConfigKey
        ? JSON.stringify(form.conditionParameters)
        : undefined,
    })
  }

  return {
    form,
    processVariables,
    update,
    updateProcessDescription,
    updateCandidateUsers,
    updateCandidateGroups,
    updateApprovalConfig,
    changeApprovalMode,
    updateCondition,
  }
}
