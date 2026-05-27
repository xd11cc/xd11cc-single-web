import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type { SystemRoleQueryVO, SystemRoleVO, SystemRoleAddVO, SystemRoleUpdateVO } from './type'

export function rolePage(data: SystemRoleQueryVO): Promise<ResponseVO<PageData<SystemRoleVO>>> {
  return request({
    url: '/system/role/page',
    method: 'POST',
    data,
  })
}

export function addRole(data: SystemRoleAddVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/role/add',
    method: 'POST',
    data,
  })
}

export function modifyRoleById(data: SystemRoleUpdateVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/role/modifyById',
    method: 'POST',
    data,
  })
}

export function removeRoleByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/system/role/removeByIds/${ids}`,
    method: 'GET',
  })
}

export function getRoleMenuIds(roleId: number): Promise<ResponseVO<number[]>> {
  return request({
    url: `/system/role/menuIds/${roleId}`,
    method: 'GET',
  })
}

export function roleList(): Promise<ResponseVO<SystemRoleVO[]>> {
  return request({
    url: '/system/role/list',
    method: 'POST',
    data: {},
  })
}
