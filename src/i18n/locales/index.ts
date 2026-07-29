import { zh as AppZh, en as AppEn } from './app'
import { zh as ChatZh, en as ChatEn } from './chat/index'
import { zh as ChatContactlistZh, en as ChatContactlistEn } from './chat/contactList'
import { zh as ChatMessageareaZh, en as ChatMessageareaEn } from './chat/messageArea'
import { zh as ChatTitleZh, en as ChatTitleEn } from './chat/title'
import { zh as CommonZh, en as CommonEn } from './common'
import { zh as DashboardActivityZh, en as DashboardActivityEn } from './dashboard/activity'
import { zh as DashboardChartsZh, en as DashboardChartsEn } from './dashboard/charts'
import { zh as DashboardGreetingZh, en as DashboardGreetingEn } from './dashboard/greeting'
import { zh as DashboardQuickZh, en as DashboardQuickEn } from './dashboard/quick'
import { zh as DashboardStatsZh, en as DashboardStatsEn } from './dashboard/stats'
import { zh as Error401Zh, en as Error401En } from './error/401'
import { zh as Error403Zh, en as Error403En } from './error/403'
import { zh as Error404Zh, en as Error404En } from './error/404'
import { zh as Error500Zh, en as Error500En } from './error/500'
import { zh as LayoutZh, en as LayoutEn } from './layout/index'
import { zh as LayoutNavigationbarZh, en as LayoutNavigationbarEn } from './layout/navigationBar'
import { zh as LayoutNotifyZh, en as LayoutNotifyEn } from './layout/notify'
import { zh as LayoutScreenfullZh, en as LayoutScreenfullEn } from './layout/screenfull'
import { zh as LayoutSearchmenuZh, en as LayoutSearchmenuEn } from './layout/searchMenu'
import { zh as LayoutSettingsZh, en as LayoutSettingsEn } from './layout/settings'
import { zh as LayoutTagsviewZh, en as LayoutTagsviewEn } from './layout/tagsView'
import { zh as LoginZh, en as LoginEn } from './login/index'
import { zh as LoginBindZh, en as LoginBindEn } from './login/bind'
import { zh as LoginForgotZh, en as LoginForgotEn } from './login/forgot'
import { zh as LoginQrcodeZh, en as LoginQrcodeEn } from './login/qrcode'
import { zh as MonitorDruidZh, en as MonitorDruidEn } from './monitor/druid'
import { zh as SystemAuthclientZh, en as SystemAuthclientEn } from './system/authClient'
import { zh as SystemConfigZh, en as SystemConfigEn } from './system/config'
import { zh as SystemDeptZh, en as SystemDeptEn } from './system/dept'
import { zh as SystemDictZh, en as SystemDictEn } from './system/dict/type'
import { zh as SystemDictDataZh, en as SystemDictDataEn } from './system/dict/data'
import { zh as SystemJobZh, en as SystemJobEn } from './system/job/index'
import { zh as SystemJobLogZh, en as SystemJobLogEn } from './system/job/log'
import { zh as SystemLoginlogZh, en as SystemLoginlogEn } from './system/loginLog'
import { zh as SystemMenuZh, en as SystemMenuEn } from './system/menu'
import { zh as SystemNoticeZh, en as SystemNoticeEn } from './system/notice'
import { zh as SystemNoticeuserZh, en as SystemNoticeuserEn } from './system/noticeUser'
import { zh as SystemOnlineuserZh, en as SystemOnlineuserEn } from './system/onlineUser'
import { zh as SystemOperatelogZh, en as SystemOperatelogEn } from './system/operateLog'
import { zh as SystemPostZh, en as SystemPostEn } from './system/post'
import { zh as SystemRoleZh, en as SystemRoleEn } from './system/role'
import { zh as SystemUserZh, en as SystemUserEn } from './system/user/index'
import { zh as SystemUserProfileZh, en as SystemUserProfileEn } from './system/user/profile'
import { zh as ToolCrongeneratorZh, en as ToolCrongeneratorEn } from './tool/cronGenerator'
import { zh as ToolGeneratecodeZh, en as ToolGeneratecodeEn } from './tool/generateCode'

export const zhCN = {
  app: AppZh,
  chat: {
    ...ChatZh,
    contactList: ChatContactlistZh,
    messageArea: ChatMessageareaZh,
    title: ChatTitleZh,
  },
  common: CommonZh,
  dashboard: {
    activity: DashboardActivityZh,
    charts: DashboardChartsZh,
    greeting: DashboardGreetingZh,
    quick: DashboardQuickZh,
    stats: DashboardStatsZh,
  },
  error: {
    401: Error401Zh,
    403: Error403Zh,
    404: Error404Zh,
    500: Error500Zh,
  },
  layout: {
    ...LayoutZh,
    navigationBar: LayoutNavigationbarZh,
    notify: LayoutNotifyZh,
    screenfull: LayoutScreenfullZh,
    searchMenu: LayoutSearchmenuZh,
    settings: LayoutSettingsZh,
    tagsView: LayoutTagsviewZh,
  },
  login: {
    ...LoginZh,
    bind: LoginBindZh,
    forgot: LoginForgotZh,
    qrcode: LoginQrcodeZh,
  },
  monitor: {
    druid: MonitorDruidZh,
  },
  system: {
    authClient: SystemAuthclientZh,
    config: SystemConfigZh,
    dept: SystemDeptZh,
    dict: {
      ...SystemDictZh,
      data: SystemDictDataZh,
    },
    job: {
      ...SystemJobZh,
      log: SystemJobLogZh,
    },
    loginLog: SystemLoginlogZh,
    menu: SystemMenuZh,
    notice: SystemNoticeZh,
    noticeUser: SystemNoticeuserZh,
    onlineUser: SystemOnlineuserZh,
    operateLog: SystemOperatelogZh,
    post: SystemPostZh,
    role: SystemRoleZh,
    user: {
      ...SystemUserZh,
      profile: SystemUserProfileZh,
    },
  },
  tool: {
    cronGenerator: ToolCrongeneratorZh,
    generateCode: ToolGeneratecodeZh,
  },
}

export const enUS = {
  app: AppEn,
  chat: {
    ...ChatEn,
    contactList: ChatContactlistEn,
    messageArea: ChatMessageareaEn,
    title: ChatTitleEn,
  },
  common: CommonEn,
  dashboard: {
    activity: DashboardActivityEn,
    charts: DashboardChartsEn,
    greeting: DashboardGreetingEn,
    quick: DashboardQuickEn,
    stats: DashboardStatsEn,
  },
  error: {
    401: Error401En,
    403: Error403En,
    404: Error404En,
    500: Error500En,
  },
  layout: {
    ...LayoutEn,
    navigationBar: LayoutNavigationbarEn,
    notify: LayoutNotifyEn,
    screenfull: LayoutScreenfullEn,
    searchMenu: LayoutSearchmenuEn,
    settings: LayoutSettingsEn,
    tagsView: LayoutTagsviewEn,
  },
  login: {
    ...LoginEn,
    bind: LoginBindEn,
    forgot: LoginForgotEn,
    qrcode: LoginQrcodeEn,
  },
  monitor: {
    druid: MonitorDruidEn,
  },
  system: {
    authClient: SystemAuthclientEn,
    config: SystemConfigEn,
    dept: SystemDeptEn,
    dict: {
      ...SystemDictEn,
      data: SystemDictDataEn,
    },
    job: {
      ...SystemJobEn,
      log: SystemJobLogEn,
    },
    loginLog: SystemLoginlogEn,
    menu: SystemMenuEn,
    notice: SystemNoticeEn,
    noticeUser: SystemNoticeuserEn,
    onlineUser: SystemOnlineuserEn,
    operateLog: SystemOperatelogEn,
    post: SystemPostEn,
    role: SystemRoleEn,
    user: {
      ...SystemUserEn,
      profile: SystemUserProfileEn,
    },
  },
  tool: {
    cronGenerator: ToolCrongeneratorEn,
    generateCode: ToolGeneratecodeEn,
  },
}
