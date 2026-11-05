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

/**
 * 只更新头像。
 *
 * 复用 modifyById 接口，但只提交 id + headUrl：
 * 后端按「非 null 字段更新」，且 roleIds 为空时不重算角色关联，
 * 因此不会像整表单保存那样覆盖其它字段。
 */
export function updateUserAvatar(data: {
  id: number
  headUrl: string
}): Promise<ResponseVO<number>> {
  return request({
    url: '/system/user/modifyById',
    method: 'POST',
    data,
  })
}

export function changePassword(data: {
  oldPassword: string
  newPassword: string
}): Promise<ResponseVO<number>> {
  return request({
    url: '/system/user/changePassword',
    method: 'POST',
    data,
  })
}
