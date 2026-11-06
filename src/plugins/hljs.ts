import hljs from 'highlight.js/lib/core'
import HighlightJS from '@highlightjs/vue-plugin'

// 1. 只导入用到的语言（按需导入，减少体积）
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import xml from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
// 可根据需要添加：python、vue、ts 等

// 2. 高亮样式（只有代码块用这个浅色主题）
import 'highlight.js/styles/vs.css'

/**
 * 代码高亮。核心与 4 个语言包（raw 117KB）只被代码块用到，
 * 所以随 CodeBlock.vue 懒加载，不进入口 chunk。
 */

let registered = false

/** 幂等注册语言：重复调用无副作用 */
export function setupHljs(): void {
  if (registered) return
  registered = true
  hljs.registerLanguage('javascript', javascript)
  hljs.registerLanguage('java', java)
  hljs.registerLanguage('xml', xml)
  hljs.registerLanguage('sql', sql)
}

/** 插件的默认导出是 Vue 插件对象，组件实例挂在 `.component` 上 */
export const HighlightjsComponent = HighlightJS.component
