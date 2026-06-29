export interface SystemNoticeUserQueryVO {
  type?: number
  readStatus?: number
  title?: string
  currentPage?: number
  pageSize?: number
}

export interface SystemNoticeUserDTO {
  id?: number
  noticeId?: number
  readStatus?: number
  readTime?: string
  title?: string
  content?: string
  type?: number
  senderName?: string
  publishTime?: string
}

export interface SystemNoticeSendVO {
  title: string
  content?: string
  receiverIds: number[]
}
