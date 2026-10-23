export type ExpressionParameterValue = string | number | boolean
export type ExpressionParameters = Record<string, ExpressionParameterValue>

export type ApprovalMode = 'single' | 'countersign' | 'orsign'

export interface ApprovalConfig {
  mode: ApprovalMode
  collection: string
  elementVariable: string
  expressionConfigKey?: string
  expressionParameters?: ExpressionParameters
}

export interface ListenerField {
  name: string
  valueType: 'stringValue' | 'expression'
  value: string
  expressionConfigKey?: string
  expressionParameters?: ExpressionParameters
}

export interface ListenerConfig {
  id: string
  listenerType: 'task' | 'execution'
  event: string
  implementationType: 'class' | 'expression' | 'delegateExpression'
  implementation: string
  expressionConfigKey?: string
  expressionParameters?: ExpressionParameters
  fields: ListenerField[]
}
