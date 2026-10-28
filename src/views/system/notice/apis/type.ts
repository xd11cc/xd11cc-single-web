export interface SystemNoticeQueryVO {
  title?: string
  type?: string
  status?: string
  currentPage?: number
  pageSize?: number
}

export interface SystemNoticeVO {
  id?: number
  title?: string
  content?: string
  type?: string
  scope?: string
  scopeDeptIds?: string
  scopeUserIds?: string
  senderId?: number
  senderName?: string
  status?: string
  publishTime?: string
  remark?: string
  createTime?: string
}

export interface SystemNoticeAddVO {
  title: string
  content?: string
  type: string
  scope: string
  scopeDeptIds?: number[]
  scopeUserIds?: number[]
  remark?: string
}

export interface SystemNoticeUpdateVO {
  id: number
  title: string
  content?: string
  type: string
  scope: string
  scopeDeptIds?: number[]
  scopeUserIds?: number[]
  remark?: string
}
