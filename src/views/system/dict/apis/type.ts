export interface SystemDictTypeQueryVO {
  dictName?: string
  dictType?: string
}

export interface SystemDictTypeVO {
  id?: number
  dictName?: string
  dictType?: string
  remark?: string
  createTime?: string
}

export interface SystemDictDataVO {
  id?: number
  dictType?: string
  label?: string
  value?: string
  cssClass?: string
  listClass?: string
  status?: string
  sort?: number
  remark?: string
}

export interface SystemDictDataQueryVO {
  dictType: string
  label?: string
  value?: string
}
