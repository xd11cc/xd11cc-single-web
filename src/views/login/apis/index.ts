import request from '@@/utils/request'
import type { UserLoginInfoVO, RouteVO, CaptchaVO } from './type'
import { ResponseVO } from 'types/api'

/**
 *
 * @param data 账号密码登录
 * @returns
 */
export function loginByPassword<T>(data: T): Promise<ResponseVO<string>> {
  return request({
    url: '/login/loginByPassword',
    method: 'POST',
    data: data,
  })
}

/**
 * 退出登录
 * @returns
 */
export function logout(): Promise<ResponseVO<string>> {
  return request({
    url: '/logout',
    method: 'GET',
  })
}

/**
 * 获取用户登录信息
 * @returns
 */
export function getUserInfo(): Promise<ResponseVO<UserLoginInfoVO>> {
  return request({
    url: '/login/getUserInfo',
    method: 'GET',
  })
}

/**
 * 获取路由信息
 * @returns
 */
export function getRoutes(): Promise<ResponseVO<RouteVO[]>> {
  return request({
    url: '/login/getRoutes',
    method: 'GET',
  })
}

/**
 * 获取验证码
 * @returns
 */
export function getCaptcha(): Promise<ResponseVO<CaptchaVO>> {
  return request({
    url: '/login/getCaptcha',
    method: 'GET',
  })
}

/**
 * 社交授权登录
 * @param source
 * @returns
 */
export function socialLogin(source: string): Promise<ResponseVO<string>> {
  return request({
    url: `/login/authorize/${source}`,
    method: 'GET',
    timeout: 30000,
  })
}
