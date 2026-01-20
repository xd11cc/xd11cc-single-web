import type { App } from 'vue'
import { KiteCaptcha, KiteConfigProvider } from 'kite-captcha-vue'

export function installKiteCaptcha(app: App) {
  // 全局加载验证码组件
  app.component('KiteCaptcha', KiteCaptcha)
  // 全局加载配置组件
  app.component('KiteConfigProvider', KiteConfigProvider)
}
