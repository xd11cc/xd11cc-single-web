import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { ApprovalMode, ListenerConfig } from './types'
import type { ElementFormState } from './useElementForm'

/**
 * 属性面板的上下文。
 *
 * 四个按元素类型拆分的子面板都嵌在同一个 <el-form> 里，共享同一份 form 与写入函数。
 * 用 provide/inject 而不是层层透传 props：用户任务面板需要 12 个绑定，
 * 走 props 会让接口比实现还长（与 ElForm / ElFormItem 的做法一致）。
 *
 * 这里把「面板需要知道的一切」显式声明成一个类型，测试可以构造假上下文注入。
 */
export interface ElementPanelContext {
  /** 当前选中的 bpmn 元素 */
  element: ComputedRef<any>
  form: ElementFormState

  // 元素类型判定
  isProcess: ComputedRef<boolean>
  isUserTask: ComputedRef<boolean>
  isServiceTask: ComputedRef<boolean>
  isSequenceFlow: ComputedRef<boolean>

  // 写入
  update: (property: string) => void
  updateProcessDescription: () => void
  updateCandidateUsers: () => void
  updateCandidateGroups: () => void
  updateApprovalConfig: () => void
  changeApprovalMode: (mode: ApprovalMode) => void
  updateCondition: () => void

  // 表达式解析
  expressionCatalog: ComputedRef<{
    resolve: (...args: any[]) => any
    options: (t: string) => any[]
    parameters: (k?: string) => any[]
  }>
  processVariableOptions: ComputedRef<Array<{ label: string; value: string }>>
  applyCollectionConfig: () => void
  applyConditionConfig: () => void
  applyAssigneeExpression: () => void

  // 选项数据
  processCategoryOptions: Ref<Array<{ label: string; value: string }>>
  candidateUserOptions: Ref<Array<{ label: string; value: string }>>
  candidateGroupOptions: Ref<Array<{ label: string; value: string }>>
  candidateUsersLoading: Ref<boolean>
  candidateGroupsLoading: Ref<boolean>
  loadCandidateUsers: () => Promise<void>
  loadCandidateGroups: () => Promise<void>

  approvalModeOptions: Array<{
    value: ApprovalMode
    labelKey: string
    descriptionKey: string
    icon: string
  }>

  listeners: Ref<ListenerConfig[]>
}

export const ELEMENT_CONTEXT: InjectionKey<ElementPanelContext> = Symbol('element-panel-context')

/** 子面板统一用它取上下文，缺失时立刻报错而不是静默渲染空表单 */
export function useElementContext() {
  const context = inject(ELEMENT_CONTEXT)
  if (!context) {
    throw new Error('[modeler] 属性子面板必须渲染在 PropertyPanel 内')
  }
  return context
}
