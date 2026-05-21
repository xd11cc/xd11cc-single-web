// core
import { pinia } from './pinia'
import { router } from './router'
import { installPlugins } from './plugins'
import App from './App.vue'

// iconify 离线图标集
import { addCollection } from '@iconify/vue'
import epIcons from '@iconify-json/ep/icons.json'
addCollection(epIcons)

// css
import '@@/assets/styles/index.scss'
import 'nprogress/nprogress.css'

// 创建应用实例
const app = createApp(App)

// 安装插件
installPlugins(app)

app.use(pinia).use(router)

// router 准备就绪后挂载应用
router.isReady().then(() => {
  app.mount('#app')
})
