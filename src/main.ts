// core
import { pinia } from './pinia'
import { router } from './router'
import { installPlugins } from './plugins'
import { i18n } from './i18n'
import App from './App.vue'

// css
import '@fontsource/outfit/latin-500.css'
import '@fontsource/outfit/latin-600.css'
import '@fontsource/outfit/latin-700.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
// 代码中存在 font-weight: 700 的正文（语言切换器字形、BPM 属性面板、流程定义页），
// 缺 700 时浏览器会用 600 合成伪粗体，字重发虚
import '@fontsource/dm-sans/latin-700.css'
import '@@/assets/styles/index.scss'
import 'nprogress/nprogress.css'

// 创建应用实例
const app = createApp(App)

// 安装插件
installPlugins(app)

// 全局错误兜底：页面级错误由 AppMain 的 onErrorCaptured 处理，这里只兜住
// 其余位置（守卫、异步组件、watcher 回调等）抛出的异常，保证不会被静默吞掉。
// 开发期不额外弹提示，避免打断调试；生产环境如需上报可在此接入。
app.config.errorHandler = (error, _instance, info) => {
  console.error(`[global error] ${info}:`, error)
}

app.use(pinia).use(router).use(i18n)

// router 准备就绪后挂载应用。
// 就绪失败（例如开发期依赖重新预构建导致懒加载 chunk 504）也必须挂载：
// index.html 里有一个静态的 #app-loading 占位，不挂载就会一直卡在 loading 页。
// 真正的导航失败由 router.onError 负责恢复（见 router/guard.ts）。
router
  .isReady()
  .catch((error) => {
    console.error('[bootstrap] 路由初始化失败：', error)
  })
  .then(() => {
    app.mount('#app')
  })
