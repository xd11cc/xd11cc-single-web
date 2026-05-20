import request from '@@/utils/request'
import type { ResponseVO } from 'types/api'
import type {
  UserLoginInfoVO,
  RouteVO,
  CaptchaVO,
  SocialUserBindVO,
  AuthClientConfigVO,
} from './type'

export function loginByPassword<LoginForm>(data: LoginForm): Promise<ResponseVO<string>> {
  return request({
    url: '/login/loginByPassword',
    method: 'POST',
    data: data,
  })
}

export function logout(): Promise<ResponseVO<string>> {
  return request({
    url: '/logout',
    method: 'GET',
  })
}

export function getUserInfo(): Promise<ResponseVO<UserLoginInfoVO>> {
  return request({
    url: '/login/getUserInfo',
    method: 'GET',
  })
}

export function getRoutes(): Promise<ResponseVO<RouteVO[]>> {
  return request({
    url: '/login/getRoutes',
    method: 'GET',
  })
}

export function getCaptcha(): Promise<ResponseVO<CaptchaVO>> {
  return request({
    url: '/login/getCaptcha',
    method: 'GET',
  })
}

export function socialLogin(source: string): Promise<ResponseVO<string>> {
  return request({
    url: `/login/authorize/${source}`,
    method: 'GET',
  })
}

export function socialUserBind(data: SocialUserBindVO): Promise<ResponseVO<string>> {
  return request({
    url: '/login/social-user/bind',
    method: 'POST',
    data: data,
  })
}

export function getSocialClientConfigList(): Promise<ResponseVO<AuthClientConfigVO[]>> {
  return request({
    url: '/auth/client/config/list',
    method: 'GET',
  })
}
