import request from '@@/utils/request'
import type { PageData, ResponseVO } from 'types/api'
import type {
  AuthClientConfigQueryVO,
  AuthClientConfigVO,
  AuthClientConfigAddVO,
  AuthClientConfigUpdateVO,
} from './type'

export function authClientConfigPage(
  data: AuthClientConfigQueryVO,
): Promise<ResponseVO<PageData<AuthClientConfigVO>>> {
  return request({
    url: '/auth/client/config/page',
    method: 'POST',
    data,
  })
}

export function addAuthClientConfig(data: AuthClientConfigAddVO): Promise<ResponseVO<number>> {
  return request({
    url: '/auth/client/config/add',
    method: 'POST',
    data,
  })
}

export function modifyAuthClientConfigById(
  data: AuthClientConfigUpdateVO,
): Promise<ResponseVO<number>> {
  return request({
    url: '/auth/client/config/modifyById',
    method: 'POST',
    data,
  })
}

export function removeAuthClientConfigByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/auth/client/config/removeByIds/${ids}`,
    method: 'GET',
  })
}
