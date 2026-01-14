// 接口通用响应类型
export interface ResponseVO<T = any> {
  code: number
  data: T
  msg: string
}

// 用户信息
export interface UserLoginInfoVO {
  id: number
  username: string
  idCard: string
  sex: string
  phone: string
  email: string
  headUrl: string
  roles: string[]
  permissions: string[]
}

// 菜单单项类型
export interface TreeMenuVO {
  id: number
  parentId: number | null
  menuName: string
  sort: number
  path: string
  component: string
  ifFrame: boolean
  menuType: string
  visible: string
  status: string
  icon: string
  children?: TreeMenuVO[]
}

// 登录参数
export interface LoginForm {
  username: string
  password: string
  way: number
  device: number
  app: number
  code: string
}
