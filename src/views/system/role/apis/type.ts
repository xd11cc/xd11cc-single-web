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
  dataScope?: string
  remark?: string
  createTime?: string
}

export interface SystemRoleAddVO {
  roleCode: string
  roleName: string
  status?: string
  dataScope?: string
  menuIds: number[]
  deptIds?: number[]
  remark?: string
}

export interface SystemRoleUpdateVO {
  id: number
  roleCode: string
  roleName: string
  status?: string
  dataScope?: string
  menuIds: number[]
  deptIds?: number[]
  remark?: string
}
