export interface SystemConfigQueryVO {
  configName?: string
  configKey?: string
}

export interface SystemConfigVO {
  id?: number
  configName?: string
  configKey?: string
  configValue?: string
  remark?: string
  createTime?: string
}
