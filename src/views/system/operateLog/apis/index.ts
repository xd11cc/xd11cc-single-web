import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type { SystemOperateLogQueryVO, SystemOperateLogVO } from './type'

export function operateLogPage(
  data: SystemOperateLogQueryVO,
): Promise<ResponseVO<PageData<SystemOperateLogVO>>> {
  return request({
    url: '/system/operateLog/page',
    method: 'POST',
    data: data,
  })
}

export function removeOperateLogByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/system/operateLog/removeByIds/${ids}`,
    method: 'GET',
  })
}

export function cleanOperateLog(): Promise<ResponseVO<void>> {
  return request({
    url: '/system/operateLog/clean',
    method: 'POST',
  })
}
