import request from '@@/utils/request'
import { PageData, ResponseVO } from 'types/api'
import type { TableInfoQueryVO, TableInfoVO, PreviewCodeVO } from './type'

export function generateCodePage(
  data: TableInfoQueryVO,
): Promise<ResponseVO<PageData<TableInfoVO>>> {
  return request({
    url: '/generate/code/page',
    method: 'POST',
    data: data,
  })
}

export function generateCode(data: string): Promise<ResponseVO<PreviewCodeVO[]>> {
  return request({
    url: `/generate/code?tableName=${data}`,
    method: 'GET',
  })
}
