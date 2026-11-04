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
  /** 不传则不改动角色关联（个人中心保存资料、只改头像时不要传） */
  roleIds?: number[]
  /** 头像对象键，来自 /file/upload 返回的 objectKey */
  headUrl?: string
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
  /** 不传则不改动角色关联（个人中心保存资料、只改头像时不要传） */
  roleIds?: number[]
  /** 头像对象键，来自 /file/upload 返回的 objectKey */
  headUrl?: string
  remark?: string
}
