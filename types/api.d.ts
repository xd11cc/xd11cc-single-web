// 接口通用响应类型
export interface ResponseVO<T> {
  code: number
  data: T
  msg: string
}
