import type { RouteMeta } from 'vue-router'

export interface UserLoginInfoVO {
  id: number
  username: string
  nickname: string
  idCard: string
  sex: string
  phone: string
  email: string
  headUrl: string
  deptId: number
  deptName: string
  postId: number
  postName: string
  roles: string[]
  roleIds: number[]
  roleNames: string[]
  permissions: string[]
}

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

export interface SocialUserBindVO {
  username: string
  password: string
  source: string
  state: string
  way: number
  device: number
  app: number
}

export interface AuthClientConfigVO {
  icon: string
  name: string
  source: string
}
