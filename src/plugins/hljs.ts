import type { App } from 'vue'
import hljs from 'highlight.js/lib/core' // 导入highlight.js核心
import HighlightJS from '@highlightjs/vue-plugin' // 正确导入Vue组件（命名导出）

// 1. 导入需要高亮的语言（按需导入，减少体积）
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import xml from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
// 可根据需要添加：java、python、vue、ts等

// 2. 导入高亮样式（任选其一，也可换其他样式）
import 'highlight.js/styles/vs.css'

// 3. 注册语言到hljs核心
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('java', java)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('sql', sql)

export function installHljs(app: App) {
  // 4. 注册Vue组件（组件名建议用HighlightJS，也可自定义）
  app.use(HighlightJS)
}
