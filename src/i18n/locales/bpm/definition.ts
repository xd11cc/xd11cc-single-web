export const zh = {
  dialogs: {
    add: '新建流程',
    edit: '编辑流程',
  },
  search: {
    name: '流程名称',
    key: '流程标识',
    category: '流程分类',
  },
  placeholder: {
    name: '请输入流程名称',
    key: '请输入流程标识',
    category: '请输入流程分类',
  },
  columns: {
    key: '流程标识',
    name: '流程名称',
    version: '版本',
    category: '分类',
    deployTime: '部署时间',
    suspended: '状态',
  },
  actions: {
    edit: '编辑',
    delete: '删除',
    versions: '版本详情',
    suspend: '挂起',
    activate: '激活',
    viewIssue: '查看异常',
  },
  versionDialog: { eyebrow: '流程版本', total: '个版本', empty: '暂无已部署版本' },
  messages: {
    onlyDraftDelete: '仅未部署草稿允许删除',
    suspendConfirm: '确认挂起该流程定义？已有流程实例不受影响。',
    activateConfirm: '确认激活该流程定义？同一流程标识下的其他激活版本将被挂起。',
    conflictHint: '存在多个已激活版本，请挂起不需要的版本后再进行操作。',
    statusUnavailable: '流程定义信息不完整，暂时无法操作。',
  },
}

export const en = {
  dialogs: {
    add: 'Create Process',
    edit: 'Edit Process',
  },
  search: {
    name: 'Process Name',
    key: 'Process Key',
    category: 'Category',
  },
  placeholder: {
    name: 'Please enter process name',
    key: 'Please enter process key',
    category: 'Please enter category',
  },
  columns: {
    key: 'Process Key',
    name: 'Process Name',
    version: 'Version',
    category: 'Category',
    deployTime: 'Deploy Time',
    suspended: 'Status',
  },
  actions: {
    edit: 'Edit',
    delete: 'Delete',
    versions: 'Versions',
    suspend: 'Suspend',
    activate: 'Activate',
    viewIssue: 'View Issue',
  },
  versionDialog: { eyebrow: 'PROCESS VERSIONS', total: 'versions', empty: 'No deployed versions' },
  messages: {
    onlyDraftDelete: 'Only undeployed drafts can be deleted',
    suspendConfirm: 'Suspend this process definition? Existing instances will not be affected.',
    activateConfirm:
      'Activate this process definition? Other active versions with the same key will be suspended.',
    conflictHint:
      'Multiple active versions exist. Suspend the versions you do not need before continuing.',
    statusUnavailable: 'The process definition information is incomplete and cannot be operated.',
  },
}
