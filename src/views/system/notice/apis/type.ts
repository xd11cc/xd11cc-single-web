export interface SystemNoticeQueryVO {
  title?: string
  type?: number
  status?: number
  currentPage?: number
  pageSize?: number
}

export interface SystemNoticeVO {
  id?: number
  title?: string
  content?: string
  type?: number
  scope?: number
  scopeDeptIds?: string
  scopeUserIds?: string
  senderId?: number
  senderName?: string
  status?: number
  publishTime?: string
  remark?: string
  createTime?: string
}

export interface SystemNoticeAddVO {
  title: string
  content?: string
  type: number
  scope: number
  scopeDeptIds?: number[]
  scopeUserIds?: number[]
  remark?: string
}

export interface SystemNoticeUpdateVO {
  id: number
  title: string
  content?: string
  type: number
  scope: number
  scopeDeptIds?: number[]
  scopeUserIds?: number[]
  remark?: string
}
