import request from '@/utils/request'

export function loginByPassword(data) {
  return request({
    url: '/user/loginByPassword',
    method: 'POST',
    data: data,
  })
}
