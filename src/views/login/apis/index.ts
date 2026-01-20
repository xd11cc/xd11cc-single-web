import request from '@/utils/request'
import type { UserLoginInfoVO, ImageCaptchaVO } from './type'
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
