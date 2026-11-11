import type { FormRules } from 'element-plus'
import type { TableColumnDef } from '@@/composables/useTableColumns'

/**
 * 列表壳与树形壳共享的 props。
 *
 * 两边各有一份「columns + 弹窗 + 列偏好」的声明，字段完全一致；
 * 抽到这里以后新增/修改一个公共 prop 只需改一处，不会漏掉另一个壳。
 */
export interface CrudShellPropsBase {
  /**
   * 表头列定义（必填）：表格列完全由壳生成，
   * 排序 / 显隐 / 列宽由用户控制并持久化，单元格用 `#cell-<prop>` 自定义。
   * 固定列放 `#table-prefix` / `#table-append`。
   */
  columns: TableColumnDef[]
  /** 列偏好的持久化键，默认取当前路由名 */
  columnKey?: string
  /** 新增/修改共用表单校验规则；只读列表可不传 */
  formRules?: FormRules
  /** 弹窗标题，不传则按新增/修改自动取 i18n 文案 */
  addTitle?: string
  editTitle?: string
  /** 只读列表：不渲染新增/修改弹窗 */
  readonly?: boolean
  /** 弹窗宽度，默认 min(760px, calc(100vw - 32px)) */
  dialogWidth?: string
  /** 表单标签宽度，默认 168px；窄标签页面（如 notice）可传 144px */
  labelWidth?: string
  /** 表单标签位置，默认 left */
  labelPosition?: 'left' | 'right' | 'top'
  /**
   * 禁止提交（如编辑时依赖数据还没回填完）。
   * 为 true 时弹窗的「确定」不可点，handleFormSubmit 也会直接返回。
   */
  submitDisabled?: boolean
  /**
   * 禁用整张表单（如编辑时依赖数据还在回填）。
   *
   * 与 submitDisabled 的区别：那个只挡提交，用户仍可在字段里输入；
   * 回填会整体覆盖表单时（如通知详情），必须连输入一起禁掉，
   * 否则用户刚打的字会被迟到的响应冲掉。
   */
  formDisabled?: boolean
}
