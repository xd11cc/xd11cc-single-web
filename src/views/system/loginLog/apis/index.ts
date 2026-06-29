import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type { SystemLoginLogQueryVO, SystemLoginLogVO } from './type'

export function loginLogPage(
  data: SystemLoginLogQueryVO,
): Promise<ResponseVO<PageData<SystemLoginLogVO>>> {
  return request({
    url: '/system/loginLog/page',
    method: 'POST',
    data: data,
  })
}

export function removeLoginLogByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/system/loginLog/removeByIds/${ids}`,
    method: 'GET',
  })
}

export function cleanLoginLog(): Promise<ResponseVO<void>> {
  return request({
    url: '/system/loginLog/clean',
    method: 'POST',
  })
}
