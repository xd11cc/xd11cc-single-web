import type { App } from 'vue'
import { installPermissionDirective } from './permission-directive'
import { installHljs } from './hljs'
import { installIconify } from './iconify'
import { installTableButtonFocusHandler } from './table-button-focus'
import { installTableLoadingDirective } from './table-loading-directive'

export function installPlugins(app: App) {
  installIconify()
  installTableButtonFocusHandler()
  installTableLoadingDirective(app)
  installPermissionDirective(app)
  installHljs(app)
}
