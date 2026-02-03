import request from '@@/utils/request'
import type {
  SystemDictTypeQueryVO,
  SystemDictTypeVO,
  SystemDictDataVO,
  SystemDictDataQueryVO,
} from './type'
import { PageData, ResponseVO } from 'types/api'

export function dictTypePage(
  data: SystemDictTypeQueryVO,
): Promise<ResponseVO<PageData<SystemDictTypeVO>>> {
  return request({
    url: '/dict/type/page',
    method: 'POST',
    data: data,
  })
}

export function addDictType(data: SystemDictTypeVO): Promise<ResponseVO<number>> {
  return request({
    url: '/dict/type/add',
    method: 'POST',
    data: data,
  })
}

export function modifyDictTypeById(data: SystemDictTypeVO): Promise<ResponseVO<boolean>> {
  return request({
    url: '/dict/type/modifyById',
    method: 'POST',
    data: data,
  })
}

export function removeDictTypeByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/dict/type/removeByIds/${ids}`,
    method: 'GET',
  })
}

export function dictTypeList(): Promise<ResponseVO<SystemDictTypeVO[]>> {
  return request({
    url: '/dict/type/list',
    method: 'GET',
  })
}

export function addDictData(data: SystemDictDataVO): Promise<ResponseVO<number>> {
  return request({
    url: '/dict/data/add',
    method: 'POST',
    data: data,
  })
}

export function removeDictDataByIds(ids: string): Promise<ResponseVO<number>> {
  return request({
    url: `/dict/data/removeByIds/${ids}`,
    method: 'GET',
  })
}

export function modifyDictDataById(data: SystemDictDataVO): Promise<ResponseVO<number>> {
  return request({
    url: '/dict/data/modifyById',
    method: 'POST',
    data: data,
  })
}

export function dictDataPage(
  data: SystemDictDataQueryVO,
): Promise<ResponseVO<PageData<SystemDictDataVO>>> {
  return request({
    url: '/dict/data/page',
    method: 'POST',
    data: data,
  })
}

export function getCache(dictType: string): Promise<ResponseVO<SystemDictDataVO[]>> {
  return request({
    url: `/dict/data/getCache/${dictType}`,
    method: 'GET',
  })
}

export function getCacheGroup(
  dictTypes: string,
): Promise<ResponseVO<Record<string, SystemDictDataVO[]>>> {
  return request({
    url: `/dict/data/getCacheGroup/${dictTypes}`,
    method: 'GET',
  })
}
