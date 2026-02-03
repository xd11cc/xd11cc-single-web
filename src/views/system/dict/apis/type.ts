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
  listClass?: ElComponentType
  status?: string
  sort?: number
  remark?: string
}

export interface SystemDictDataQueryVO {
  dictType: string
  label?: string
  value?: string
  status?: string
}

/**
 * 字典映射（键值对）：value -> label
 */
export type DictMap = Record<string | number, string>

/**
 * element-plus支持的按钮/标签类型
 */
export type ElComponentType = 'primary' | 'success' | 'info' | 'warning' | 'danger'
