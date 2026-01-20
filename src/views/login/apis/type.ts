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

// 登录参数
export interface LoginForm {
  username: string
  password: string
  way: number
  device: number
  app: number
  code: string
}

// 路由参数
export interface RouteVO {
  name: string
  path: string
  component: string
  redirect: string
  meta: MetaVO
  children: RouteVO[]
}

// 其他元素
export interface MetaVO {
  title: string
  elIcon: string
  query: string
  hidden: boolean
  permission: string
}
