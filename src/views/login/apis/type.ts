import type { RouteMeta } from 'vue-router'

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

export interface PhoneSmsLoginForm {
  phone: string
  smsCode: string
  way: 1
  device: number
  app: number
  rememberMe: boolean
}

export interface QrCodeVO {
  qrCodeId: string
  qrCodeUrl: string
  expireSeconds: number
}

export enum QrCodeStatus {
  WAITING = 'WAITING',
  SCANNED = 'SCANNED',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
}

export interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
  phone: string
  smsCode: string
  email: string
  captcha: string
  captchaId: string
}

export interface ResetPasswordForm {
  account: string
  code: string
  newPassword: string
  confirmPassword: string
}

export interface BindUserForm {
  username: string
  password: string
  socialToken: string
}
