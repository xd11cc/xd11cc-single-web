import { defineComponent, h } from 'vue'
import { ElTableColumn } from 'element-plus'

/**
 * el-table-column 的透明包装（vite.config.ts 用自定义 resolver 让它全局生效）。
 *
 * index.scss 对 .el-table .cell 做了 nowrap + 省略号截断，而完整内容提示需要逐列
 * 声明 show-overflow-tooltip，人工配置容易漏，所以这里对「普通文本列」自动开启：
 * 非功能列（type）、非 fixed、且没有 #default 插槽。显式声明的那一列仍以声明值为准。
 * 其余 props / attrs / 插槽原样透传。
 *
 * Element Plus 按组件名识别嵌套子列、按渲染顺序计算列序，因此包一层不影响列注册与排序，
 * 但 name 要跟着保持为 ElTableColumn。
 */
export default defineComponent({
  // Element Plus 处理多级表头时会按这个组件名识别嵌套子列
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
