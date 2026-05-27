export interface SystemUserQueryVO {
  username?: string
  nickname?: string
  phone?: string
  status?: string
  deptId?: number
  currentPage?: number
  pageSize?: number
}

export interface SystemUserVO {
  id?: number
  username?: string
  password?: string
  nickname?: string
  idCard?: string
  sex?: string
  phone?: string
  email?: string
  deptId?: number
  deptName?: string
  postId?: number
  postName?: string
  status?: string
  headUrl?: string
  roleIds?: number[]
  remark?: string
  createTime?: string
}

export interface SystemUserAddVO {
  username: string
  password: string
  nickname: string
  sex: string
  phone?: string
  email?: string
  idCard?: string
  deptId: number
  deptName: string
  postId: number
  postName: string
  status: string
  roleIds: number[]
  remark?: string
}

export interface SystemUserUpdateVO {
  id: number
  username: string
  nickname: string
  sex: string
  phone?: string
  email?: string
  idCard?: string
  deptId: number
  deptName: string
  postId: number
  postName: string
  status: string
  roleIds: number[]
  remark?: string
}
