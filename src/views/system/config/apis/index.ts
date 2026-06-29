import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type { SystemConfigQueryVO, SystemConfigVO } from './type'

export function configPage(
  data: SystemConfigQueryVO,
): Promise<ResponseVO<PageData<SystemConfigVO>>> {
  return request({
    url: '/system/config/page',
    method: 'POST',
    data: data,
  })
}

export function addConfig(data: SystemConfigVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/config/add',
    method: 'POST',
    data: data,
  })
}

export function modifyConfigById(data: SystemConfigVO): Promise<ResponseVO<boolean>> {
  return request({
    url: '/system/config/modifyById',
    method: 'POST',
    data: data,
  })
}

export function removeConfigByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/system/config/removeByIds/${ids}`,
    method: 'GET',
  })
}
