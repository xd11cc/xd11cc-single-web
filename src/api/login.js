import request from '@/utils/request'

export function loginByPassword() {
  return request({
    url: '/user/loginByPassword',
    method: 'POST',
  })
}
