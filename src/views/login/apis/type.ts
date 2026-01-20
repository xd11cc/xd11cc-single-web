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

// 生成验证码信息
export interface ImageCaptchaVO {
  id: string
  type: string
  backgroundImage: string
  templateImage: string
  backgroundImageTag: string
  templateImageTag: string
  backgroundImageWidth: number
  backgroundImageHeight: number
  templateImageWidth: number
  templateImageHeight: number
  data: object
}
