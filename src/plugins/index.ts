import type { App } from 'vue'
import { installElementPlusIcons } from './element-plus-icons'
import { installPermissionDirective } from './permission-directive'
import { installSvgIcon } from './svg-icon'
import { installHljs } from './hljs'

export function installPlugins(app: App) {
  installElementPlusIcons(app)
  installPermissionDirective(app)
  installSvgIcon(app)
  installHljs(app)
}
