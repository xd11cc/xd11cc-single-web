export interface TableInfoVO {
  tableName: string
  tableComment: string
  createTime: string
}

export interface TableInfoQueryVO {
  tableName?: string
  tableComment?: string
}

export interface PreviewCodeVO {
  fileName: string
  content: string
}
