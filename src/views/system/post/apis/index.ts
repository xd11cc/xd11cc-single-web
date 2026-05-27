import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type { SystemPostQueryVO, SystemPostVO, SystemPostAddVO, SystemPostUpdateVO } from './type'

export function postPage(data: SystemPostQueryVO): Promise<ResponseVO<PageData<SystemPostVO>>> {
  return request({
    url: '/system/post/page',
    method: 'POST',
    data,
  })
}

export function addPost(data: SystemPostAddVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/post/add',
    method: 'POST',
    data,
  })
}

export function modifyPostById(data: SystemPostUpdateVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/post/modifyById',
    method: 'POST',
    data,
  })
}

export function removePostByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/system/post/removeByIds/${ids}`,
    method: 'GET',
  })
}

export function getPostDeptIds(postId: number): Promise<ResponseVO<number[]>> {
  return request({
    url: `/system/post/deptIds/${postId}`,
    method: 'GET',
  })
}

export function postListByDeptId(deptId: number): Promise<ResponseVO<SystemPostVO[]>> {
  return request({
    url: `/system/post/listByDeptId/${deptId}`,
    method: 'GET',
  })
}
