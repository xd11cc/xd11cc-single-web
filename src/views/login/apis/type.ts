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
