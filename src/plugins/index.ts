import type { App } from 'vue'
import { installPermissionDirective } from './permission-directive'
import { installHljs } from './hljs'
import { installIconify } from './iconify'
import { installTableButtonFocusHandler } from './table-button-focus'

export function installPlugins(app: App) {
  installIconify()
  installTableButtonFocusHandler()
  installPermissionDirective(app)
  installHljs(app)
}
