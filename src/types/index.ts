// 接口通用响应类型
export interface ResponseVO<T = any> {
  code: number
  data: T
  msg: string
}

export interface UserLoginInfoVO {
  id: number
  username: string
  idCard: string
  sex: string
  phone: string
  email: string
  headUrl: string
  treeMenuVOS: TreeMenuVO[]
}

// 菜单单项类型
export interface TreeMenuVO {
  id: number
  parentId: number | null
  menuName: string
  sort: number
  path: string
  component: string
  ifFrame: string
  menuType: string
  visible: string
  status: string
  icon: string
  children?: TreeMenuVO[]
}
