export interface SystemRoleQueryVO {
  roleCode?: string
  roleName?: string
  status?: string
  currentPage?: number
  pageSize?: number
}

export interface SystemRoleVO {
  id?: number
  roleCode?: string
  roleName?: string
  status?: string
  remark?: string
  createTime?: string
}

export interface SystemRoleAddVO {
  roleCode: string
  roleName: string
  status?: string
  menuIds: number[]
  remark?: string
}

export interface SystemRoleUpdateVO {
  id: number
  roleCode: string
  roleName: string
  status?: string
  menuIds: number[]
  remark?: string
}
