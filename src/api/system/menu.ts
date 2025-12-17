import request from '@/utils/request.js'
import type { ResponseVO, TreeMenuVO } from '@/types'

export function getTreeMenu(): Promise<ResponseVO<TreeMenuVO[]>> {
  return request({
    url: '/menu/getTreeMenu',
    method: 'GET',
  })
}
