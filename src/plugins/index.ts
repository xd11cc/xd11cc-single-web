import type { App } from 'vue'
import { installPermissionDirective } from './permission-directive'
import { installSvgIcon } from './svg-icon'
import { installHljs } from './hljs'

export function installPlugins(app: App) {
  installPermissionDirective(app)
  installSvgIcon(app)
  installHljs(app)
}
