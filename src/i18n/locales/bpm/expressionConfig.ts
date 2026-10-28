export const zh = {
  fields: {
    name: '配置名称',
    key: '配置键',
    type: '使用场景',
    returnType: '返回类型',
    template: '表达式模板',
    parameters: '参数定义',
    status: '状态',
    remark: '备注',
    preview: '模板预览',
  },
  actions: { addParameter: '添加参数', delete: '删除' },
  status: { enabled: '正常', disabled: '停用' },
  dialog: { add: '新增表达式配置', edit: '编辑表达式配置' },
  parameter: { key: '参数 Key', name: '参数名称', type: '参数类型', required: '必填' },
  messages: {
    required: '请输入{name}',
    completeParameters: '请完善参数定义',
    deleteConfirm: '确认删除该表达式配置？',
    batchDeleteConfirm: '确认删除选中的 {count} 条配置？',
    keyHint: '小写字母开头',
    templateHint:
      '使用 Flowable 表达式语法；参数使用“参数 Key”占位，保存时会替换为实际参数值。示例：{example}',
  },
}

export const en = {
  fields: {
    name: 'Name',
    key: 'Config Key',
    type: 'Usage',
    returnType: 'Return Type',
    template: 'Expression Template',
    parameters: 'Parameters',
    status: 'Status',
    remark: 'Remark',
    preview: 'Template Preview',
  },
  actions: { addParameter: 'Add Parameter', delete: 'Delete' },
  status: { enabled: 'Enabled', disabled: 'Disabled' },
  dialog: { add: 'Add Expression Configuration', edit: 'Edit Expression Configuration' },
  parameter: {
    key: 'Parameter Key',
    name: 'Parameter Name',
    type: 'Parameter Type',
    required: 'Required',
  },
  messages: {
    required: 'Please enter {name}',
    completeParameters: 'Please complete the parameter definitions',
    deleteConfirm: 'Delete this expression configuration?',
    batchDeleteConfirm: 'Delete the selected {count} configurations?',
    keyHint: 'Start with a lowercase letter',
    templateHint:
      'Use Flowable expression syntax. Put parameter keys in placeholders; they are replaced with actual values when the expression is used. Example: {example}',
  },
}
