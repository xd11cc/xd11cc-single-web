// core
import { pinia } from './pinia'
import { router } from './router'
import { installPlugins } from './plugins'
import App from './App.vue'

// css
import '@/styles/index.scss'
import 'nprogress/nprogress.css'

// 动态设置标题
document.title = import.meta.env.VITE_APP_TITLE
// 创建应用实例
const app = createApp(App)

// 安装插件
installPlugins(app)

app.use(pinia).use(router)

// router 准备就绪后挂载应用
router.isReady().then(() => {
  app.mount('#app')
})
