import { defineComponent, h } from 'vue'
import { ElTableColumn } from 'element-plus'

/**
 * el-table-column 的透明包装组件（通过 vite.config.ts 中的自定义 resolver 全局生效）。
 *
 * 背景：index.scss 对 .el-table .cell 全局做了 nowrap + ellipsis 截断，
 * 但 Element Plus 的悬浮完整内容提示需要逐列声明 show-overflow-tooltip，
 * 靠人工逐列配置容易遗漏，新增页面也总会忘。
 *
 * 该包装为“普通文本列”自动开启 show-overflow-tooltip，判定规则：
 * - 列上未显式声明 show-overflow-tooltip（显式声明时以声明值优先）
 * - 不是 type="selection | index | expand" 功能列
 * - 不是 fixed 列（操作按钮列无需 tooltip，且全局样式已对其放开裁剪）
 * - 没有 #default 插槽（插槽内容通常是标签/开关/图标等短内容，
 *   需要 tooltip 的插槽列请显式声明 show-overflow-tooltip）
 *
 * 其余 props、attrs、插槽全部原样透传，行为与原生 el-table-column 一致。
 * Element Plus 内部通过 vParent 向上查找表格实例、按渲染 DOM 顺序计算列序，
 * 因此包装一层组件不影响列注册与排序。
 */
export default defineComponent({
  // 名称必须保持为 ElTableColumn：Element Plus 处理多级表头时
  // 会按该组件名识别嵌套的子列
  name: 'ElTableColumn',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => {
      const explicit = (attrs.showOverflowTooltip ?? attrs['show-overflow-tooltip']) as
        | boolean
        | string
        | undefined
      const isPlainColumn = !attrs.type && !attrs.fixed && !slots.default
      const props: Record<string, unknown> = { ...attrs }
      delete props['show-overflow-tooltip']
      props.showOverflowTooltip = explicit ?? (isPlainColumn || undefined)
      return h(ElTableColumn, props, slots)
    }
  },
})
