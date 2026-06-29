import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type { SystemNoticeUserQueryVO, SystemNoticeUserDTO, SystemNoticeSendVO } from './type'

export function myNoticePage(data: SystemNoticeUserQueryVO): Promise<ResponseVO<PageData<SystemNoticeUserDTO>>> {
  return request({
    url: '/system/notice-user/myPage',
    method: 'POST',
    data,
  })
}

export function sendNotice(data: SystemNoticeSendVO): Promise<ResponseVO<void>> {
  return request({
    url: '/system/notice-user/send',
    method: 'POST',
    data,
  })
}

export function markAsRead(noticeId: number): Promise<ResponseVO<void>> {
  return request({
    url: `/system/notice-user/markAsRead/${noticeId}`,
    method: 'POST',
  })
}

export function markAllAsRead(type?: number): Promise<ResponseVO<void>> {
  return request({
    url: '/system/notice-user/markAllAsRead',
    method: 'POST',
    params: type !== undefined ? { type } : {},
  })
}

export function unreadCount(): Promise<ResponseVO<Record<string, number>>> {
  return request({
    url: '/system/notice-user/unreadCount',
    method: 'GET',
  })
}
