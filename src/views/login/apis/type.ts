import type { RouteMeta } from 'vue-router'

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
  captcha: string
  captchaId: string
  rememberMe: boolean
}

// 路由参数
export interface RouteVO {
  id: number
  parentId: number
  name: string
  path: string
  component: string
  redirect: string
  meta: RouteMeta
  sort: number
  children: []
}

export interface CaptchaVO {
  captchaId: string
  image: string
}

export enum SourceEnum {
  github = 'GITHUB',
  wechat = 'WECHAT',
  qq = 'qq',
}
