import request from '@@/utils/request'
import type { ResponseVO } from 'types/api'
import type { OnlineUserVO } from './type'

export function onlineUserList(username?: string): Promise<ResponseVO<OnlineUserVO[]>> {
  return request({
    url: '/system/onlineUser/list',
    method: 'GET',
    params: { username },
  })
}

export function forceLogout(tokenId: string): Promise<ResponseVO<void>> {
  return request({
    url: `/system/onlineUser/forceLogout/${tokenId}`,
    method: 'GET',
  })
}
