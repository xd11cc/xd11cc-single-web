export interface SystemNoticeUserQueryVO {
  type?: string
  readStatus?: string
  title?: string
  currentPage?: number
  pageSize?: number
}

export interface SystemNoticeUserDTO {
  id?: number
  noticeId?: number
  readStatus?: string
  readTime?: string
  title?: string
  content?: string
  type?: string
  senderName?: string
  publishTime?: string
}

export interface SystemNoticeSendVO {
  title: string
  content?: string
  receiverIds: number[]
}
