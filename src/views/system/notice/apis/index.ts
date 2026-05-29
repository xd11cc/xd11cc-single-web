import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type { SystemNoticeQueryVO, SystemNoticeVO, SystemNoticeAddVO, SystemNoticeUpdateVO } from './type'

export function noticePage(data: SystemNoticeQueryVO): Promise<ResponseVO<PageData<SystemNoticeVO>>> {
  return request({
    url: '/system/notice/page',
    method: 'POST',
    data,
  })
}

export function addNotice(data: SystemNoticeAddVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/notice/add',
    method: 'POST',
    data,
  })
}

export function modifyNoticeById(data: SystemNoticeUpdateVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/notice/modifyById',
    method: 'POST',
    data,
  })
}

export function removeNoticeByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/system/notice/removeByIds/${ids}`,
    method: 'GET',
  })
}

export function getNoticeById(id: number): Promise<ResponseVO<SystemNoticeVO>> {
  return request({
    url: `/system/notice/getById/${id}`,
    method: 'GET',
  })
}

export function publishNotice(id: number): Promise<ResponseVO<void>> {
  return request({
    url: `/system/notice/publish/${id}`,
    method: 'POST',
  })
}

export function revokeNotice(id: number): Promise<ResponseVO<void>> {
  return request({
    url: `/system/notice/revoke/${id}`,
    method: 'POST',
  })
}
