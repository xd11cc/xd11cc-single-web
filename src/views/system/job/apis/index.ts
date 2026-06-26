import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type {
  SystemJobQueryVO,
  SystemJobVO,
  SystemJobAddVO,
  SystemJobUpdateVO,
  SystemJobLogQueryVO,
  SystemJobLogVO,
} from './type'

export function jobPage(data: SystemJobQueryVO): Promise<ResponseVO<PageData<SystemJobVO>>> {
  return request({
    url: '/system/job/page',
    method: 'POST',
    data,
  })
}

export function addJob(data: SystemJobAddVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/job/add',
    method: 'POST',
    data,
  })
}

export function modifyJobById(data: SystemJobUpdateVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/job/modifyById',
    method: 'POST',
    data,
  })
}

export function removeJobByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/system/job/removeByIds/${ids}`,
    method: 'GET',
  })
}

export function changeJobStatus(id: number, status: string): Promise<ResponseVO<number>> {
  return request({
    url: `/system/job/changeStatus/${id}/${status}`,
    method: 'GET',
  })
}

export function runJobOnce(id: number): Promise<ResponseVO<void>> {
  return request({
    url: `/system/job/runOnce/${id}`,
    method: 'GET',
  })
}

export function jobLogPage(
  data: SystemJobLogQueryVO,
): Promise<ResponseVO<PageData<SystemJobLogVO>>> {
  return request({
    url: '/system/jobLog/page',
    method: 'POST',
    data,
  })
}

export function removeJobLogByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/system/jobLog/removeByIds/${ids}`,
    method: 'GET',
  })
}
