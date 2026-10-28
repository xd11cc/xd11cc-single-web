import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type { SystemMqFailQueryVO, SystemMqFailVO } from './type'

/**
 * 分页查询 MQ 失败消息
 */
export function mqFailPage(
  data: SystemMqFailQueryVO,
): Promise<ResponseVO<PageData<SystemMqFailVO>>> {
  return request({
    url: '/system/mq-fail/page',
    method: 'POST',
    data: data,
  })
}

/**
 * 重新投递失败消息
 */
export function replayMqFail(id: number): Promise<ResponseVO<void>> {
  return request({
    url: `/system/mq-fail/replay/${id}`,
    method: 'POST',
  })
}

/**
 * 编辑消息体后重新投递
 */
export function replayEditMqFail(id: number, data: string): Promise<ResponseVO<void>> {
  return request({
    url: `/system/mq-fail/replay-edit/${id}`,
    method: 'POST',
    data: { data },
  })
}

/**
 * 忽略失败消息
 */
export function ignoreMqFail(id: number): Promise<ResponseVO<void>> {
  return request({
    url: `/system/mq-fail/ignore/${id}`,
    method: 'POST',
  })
}
