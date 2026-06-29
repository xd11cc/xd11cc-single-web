export interface SystemOperateLogQueryVO {
  module?: string
  operateType?: string
  status?: string
}

export interface SystemOperateLogVO {
  id?: number
  module?: string
  operateType?: string
  operateDesc?: string
  method?: string
  requestMethod?: string
  requestUrl?: string
  requestParam?: string
  responseResult?: string
  status?: string
  errorMsg?: string
  operateIp?: string
  costTime?: number
  createUserId?: number
  createTime?: string
}
