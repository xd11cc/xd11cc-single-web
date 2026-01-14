// 布局模式
export enum LayoutModeEnum {
  Left = 'left',
  Top = 'top',
  LeftTop = 'left-top',
}

// 侧边栏打开状态常量
export const SIDEBAR_OPENED = 'opened'

// 侧边栏关闭状态常量
export const SIDEBAR_CLOSED = 'closed'

export type sidebarOpend = typeof SIDEBAR_OPENED

export type sidebarClosed = typeof SIDEBAR_CLOSED

// 设备类型
export enum DeviceEnum {
  Mobile,
  Desktop,
}
