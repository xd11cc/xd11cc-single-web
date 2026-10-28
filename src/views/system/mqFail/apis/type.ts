/**
 * MQ 失败消息查询参数
 */
export interface SystemMqFailQueryVO {
  messageId?: string
  queueName?: string
  status?: string
}

/**
 * MQ 失败消息
 */
export interface SystemMqFailVO {
  id?: number
  messageId?: string
  queueName?: string
  data?: string
  messageType?: string
  errorMsg?: string
  retryCount?: number
  status?: string
  tenantId?: number
  createUserId?: number
  createTime?: string
  updateTime?: string
  remark?: string
}
