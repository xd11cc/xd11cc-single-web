export interface SystemLoginLogQueryVO {
  username?: string
  loginType?: string
  status?: string
}

export interface SystemLoginLogVO {
  id?: number
  username?: string
  loginType?: string
  status?: string
  loginIp?: string
  browser?: string
  os?: string
  msg?: string
  loginTime?: string
}
