export interface SystemDeptQueryVO {
  deptName?: string
  status?: string
}

export interface SystemDeptVO {
  id?: number
  parentId?: number
  deptCode?: string
  deptName?: string
  leaderId?: number
  sort?: number
  status?: string
  remark?: string
  createTime?: string
}

export interface SystemDeptTreeVO extends SystemDeptVO {
  children?: SystemDeptTreeVO[]
}

export interface SystemDeptAddVO {
  parentId?: number
  deptCode: string
  deptName: string
  leaderId?: number
  sort?: number
  status?: string
  remark?: string
}

export interface SystemDeptUpdateVO {
  id: number
  parentId?: number
  deptCode: string
  deptName: string
  leaderId?: number
  sort?: number
  status?: string
  remark?: string
}
