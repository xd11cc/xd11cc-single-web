import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type { SystemUserQueryVO, SystemUserVO, SystemUserAddVO, SystemUserUpdateVO } from './type'

export function userPage(data: SystemUserQueryVO): Promise<ResponseVO<PageData<SystemUserVO>>> {
  return request({
    url: '/system/user/page',
    method: 'POST',
    data,
  })
}

export function getUserById(id: number): Promise<ResponseVO<SystemUserVO>> {
  return request({
    url: `/system/user/getById/${id}`,
    method: 'GET',
  })
}

export function addUser(data: SystemUserAddVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/user/add',
    method: 'POST',
    data,
  })
}

export function modifyUserById(data: SystemUserUpdateVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/user/modifyById',
    method: 'POST',
    data,
  })
}

export function removeUserByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/system/user/removeByIds/${ids}`,
    method: 'GET',
  })
}

export function resetPassword(id: number, newPassword: string): Promise<ResponseVO<number>> {
  return request({
    url: `/system/user/resetPassword/${id}`,
    method: 'POST',
    params: { newPassword },
  })
}

export function userList(): Promise<ResponseVO<SystemUserVO[]>> {
  return request({
    url: '/system/user/list',
    method: 'POST',
    data: {},
  })
}

export function changePassword(data: { oldPassword: string; newPassword: string }): Promise<ResponseVO<number>> {
  return request({
    url: '/system/user/changePassword',
    method: 'POST',
    data,
  })
}
