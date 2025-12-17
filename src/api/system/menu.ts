import request from '@/utils/request.js'

export function getTreeMenu() {
  return request({
    url: '/menu/getTreeMenu',
    method: 'GET',
  })
}
