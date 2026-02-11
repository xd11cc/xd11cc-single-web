import request from '@@/utils/request'
import type { ResponseVO } from 'types/api'
import type { SystemMenuVO, SystemMenuQueryVO, SystemMenuTreeVO } from './type'

export function treeList(data: SystemMenuQueryVO): Promise<ResponseVO<SystemMenuTreeVO[]>> {
  return request({
    url: '/menu/treeList',
    method: 'POST',
    data: data,
  })
}

export function addMenu(data: SystemMenuVO): Promise<ResponseVO<number>> {
  return request({
    url: '/menu/add',
    method: 'POST',
    data: data,
  })
}

export function removeById(id: number): Promise<ResponseVO<number>> {
  return request({
    url: `/menu/removeById/${id}`,
    method: 'GET',
  })
}

export function modifyById(data: SystemMenuVO): Promise<ResponseVO<number>> {
  return request({
    url: '/menu/modifyById',
    method: 'POST',
    data: data,
  })
}
