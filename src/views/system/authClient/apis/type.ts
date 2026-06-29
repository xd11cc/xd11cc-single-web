export interface AuthClientConfigQueryVO {
  source?: string
  name?: string
  status?: string
  currentPage?: number
  pageSize?: number
}

export interface AuthClientConfigVO {
  id?: number
  source?: string
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  name?: string
  icon?: string
  sort?: number
  status?: string
  remark?: string
  createTime?: string
}

export interface AuthClientConfigAddVO {
  source: string
  clientId: string
  clientSecret: string
  redirectUri?: string
  name?: string
  icon: string
  status: string
  sort?: number
  remark?: string
}

export interface AuthClientConfigUpdateVO {
  id: number
  source: string
  clientId: string
  clientSecret: string
  redirectUri?: string
  name?: string
  icon: string
  status: string
  sort?: number
  remark?: string
}
