import request from '@/utils/request'
import type { ResponseVO, LoginResultVO } from '@/types'

export function loginByPassword<T>(data: T): Promise<ResponseVO<LoginResultVO>> {
  return request({
    url: '/user/loginByPassword',
    method: 'POST',
    data: data,
  })
}

export function logout(): Promise<ResponseVO> {
  return request({
    url: '/logout',
    method: 'GET',
  })
}
