import request from '@@/utils/request'
import type { ResponseVO } from 'types/api'
import type {
  SystemDeptQueryVO,
  SystemDeptTreeVO,
  SystemDeptAddVO,
  SystemDeptUpdateVO,
} from './type'

export function deptTreeList(data: SystemDeptQueryVO): Promise<ResponseVO<SystemDeptTreeVO[]>> {
  return request({
    url: '/system/dept/treeList',
    method: 'POST',
    data,
  })
}

export function addDept(data: SystemDeptAddVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/dept/add',
    method: 'POST',
    data,
  })
}

export function modifyDeptById(data: SystemDeptUpdateVO): Promise<ResponseVO<number>> {
  return request({
    url: '/system/dept/modifyById',
    method: 'POST',
    data,
  })
}

export function removeDeptById(id: number): Promise<ResponseVO<number>> {
  return request({
    url: `/system/dept/removeById/${id}`,
    method: 'GET',
  })
}
