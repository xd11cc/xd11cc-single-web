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
  /** 展示文案 */
  label?: string
  /** 编码，与业务列的取值对应 */
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
 * 字典映射：编码（value） -> 展示文案（label）
 */
export type DictMap = Record<string | number, string>

/**
 * element-plus支持的按钮/标签类型
 */
export type ElComponentType = 'primary' | 'success' | 'info' | 'warning' | 'danger'
