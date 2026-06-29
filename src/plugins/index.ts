import type { App } from 'vue'
import { installPermissionDirective } from './permission-directive'
import { installHljs } from './hljs'
import { installIconify } from './iconify'

export function installPlugins(app: App) {
  installIconify()
  installPermissionDirective(app)
  installHljs(app)
}
