// 接口通用响应类型
export interface ResponseVO<T = any> {
  code: number
  data: T
  msg: string
}

// 菜单单项类型
export interface TreeMenuVO {
  id: number
  parentId: number | null
  menuName: string
  sort: number
  path: string
  component: string
  ifFrame: string
  menuType: string
  visible: string
  status: string
  icon: string
  children?: TreeMenuVO[]
}

// 登录接口返回
export interface LoginResultVO {
  userId: number
  accessToken: string
}
