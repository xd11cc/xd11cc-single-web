export interface SystemMenuQueryVO {
  menuName?: string
  status?: string
}

export interface SystemMenuTreeVO {
  id?: number
  parentId?: number
  menuName?: string
  sort?: number
  path?: string
  component?: string
  routeName?: string
  query?: string
  icon?: string
  menuType?: string
  status?: string
  permission?: string
  visible?: string
  remark?: string
  createTime?: string
  children?: SystemMenuTreeVO[]
}

export interface SystemMenuVO {
  id?: number
  parentId?: number
  menuName?: string
  sort?: number
  path?: string
  component?: string
  routeName?: string
  query?: string
  icon?: string
  menuType?: string
  status?: string
  permission?: string
  visible?: string
  remark?: string
}
