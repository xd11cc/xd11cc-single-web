export interface SystemPostQueryVO {
  postCode?: string
  postName?: string
  status?: string
  currentPage?: number
  pageSize?: number
}

export interface SystemPostVO {
  id?: number
  postCode?: string
  postName?: string
  status?: string
  remark?: string
  createTime?: string
}

export interface SystemPostAddVO {
  postCode: string
  postName: string
  status: string
  deptIds: number[]
  remark?: string
}

export interface SystemPostUpdateVO {
  id: number
  postCode: string
  postName: string
  status: string
  deptIds: number[]
  remark?: string
}
