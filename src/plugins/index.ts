import type { App } from 'vue'
import { installPermissionDirective } from './permission-directive'
import { installIconify } from './iconify'
import { installTableButtonFocusHandler } from './table-button-focus'
import { installTableLoadingDirective } from './table-loading-directive'

export function installPlugins(app: App) {
  installIconify()
  installTableButtonFocusHandler()
  installTableLoadingDirective(app)
  installPermissionDirective(app)
  // 注：highlight.js 不在这里注册。它只服务 CodeBlock 一个组件，全局注册会把
  // 核心与 4 个语言包（raw 117KB）塞进入口 chunk；现由
  // `views/tool/generateCode/components/CodeBlock.vue` 自行按需引入。
}
