import type { ResponseVO } from 'types/api'

/**
 * 列表壳（useCrud）与树形壳（useTreeCrud）共享的配置字段。
 *
 * 两个壳的核心动作语义不同（分页 vs 整树、按 id 串删 vs 单 id 删），
 * 但「新增 / 修改 / 载荷转换 / 删除确认 / 弹窗回调」这一层是一致的，
 * 抽出来避免两边各写一份、日后漂移。
 *
 * @typeParam TOpenContext 弹窗打开回调的上下文：列表壳给 `row`，树形壳给 `parent`
 */
export interface BaseCrudOptions<TOpenContext = { isAdd: boolean; form: Record<string, any> }> {
  /** 新增接口 */
  addApi?: (data: any) => Promise<ResponseVO<any>>
  /** 修改接口 */
  updateApi?: (data: any) => Promise<ResponseVO<any>>
  /** 提交前转换 formData 为 API 需要的载荷（如补 deptName / postName 等关联字段） */
  transformPayload?: (form: any, isAdd: boolean) => any
  /** 新增/修改共用默认表单 */
  defaultForm?: () => Record<string, any>
  /** 单条删除的确认文案，默认使用通用文案 */
  removeConfirmText?: (row: any) => string
  /**
   * 弹窗打开后的钩子（新增 / 编辑共用），用于按当前行回填联动数据，
   * 如部门树勾选、岗位下拉列表、dataScope 默认值。
   *
   * 触发时 formData 已赋值、dialogVisible 已置 true，但 DOM 尚未更新。
   * slotProps 里存的是原函数引用，替换返回对象上的方法不会生效。
   */
  onDialogOpen?: (context: TOpenContext) => void
}

/**
 * 弹窗组件（CrudFormDialog）需要的最小契约。
 *
 * 两个壳的完整 slotProps 类型不同，但都满足这几项，因此可以直接传入。
 */
export interface CrudDialogSlotProps {
  formData: any
  dialogVisible: boolean
  handleSubmit: (isAdd: boolean) => Promise<ResponseVO<any> | void>
  handleClose: () => void
}

/**
 * 搜索卡片组件（CrudSearchCard）需要的最小契约。
 */
export interface CrudSearchSlotProps {
  searchData: any
  handleSearch: () => void
  resetSearch: () => void
}
