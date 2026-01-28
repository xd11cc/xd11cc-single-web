import request from '@@/utils/request'
import type { SystemDictTypeQueryVO, SystemDictTypeDO } from './type'
import { PageData, ResponseVO } from 'types/api'

export function page(data: SystemDictTypeQueryVO): Promise<ResponseVO<PageData<SystemDictTypeDO>>> {
  return request({
    url: '/dict/type/page',
    method: 'POST',
    data: data,
  })
}

export function add(data: SystemDictTypeDO) {
  return request({
    url: '/dict/type/add',
    method: 'POST',
    data: data,
  })
}

export function modifyById(data: SystemDictTypeDO) {
  return request({
    url: '/dict/type/modifyById',
    method: 'POST',
    data: data,
  })
}

export function removeByIds(ids: string) {
  return request({
    url: `/dict/type/removeByIds/${ids}`,
    method: 'GET',
  })
}
