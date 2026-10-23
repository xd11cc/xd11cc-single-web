export interface WorkflowExpressionConfigQueryVO {
  configKey?: string
  configName?: string
  expressionType?: string
  status?: string
}

export interface WorkflowExpressionConfigVO {
  id?: number
  configKey?: string
  configName?: string
  expressionType?: string
  expressionTemplate?: string
  parameterSchema?: string
  returnType?: string
  status?: string
  remark?: string
  createTime?: string
}

export interface ExpressionParameterDefinition {
  key: string
  name: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'PROCESS_VARIABLE'
  required: boolean
}
