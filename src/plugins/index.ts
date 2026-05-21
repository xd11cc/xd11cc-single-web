import type { App } from 'vue'
import { installPermissionDirective } from './permission-directive'
import { installHljs } from './hljs'

export function installPlugins(app: App) {
  installPermissionDirective(app)
  installHljs(app)
}
