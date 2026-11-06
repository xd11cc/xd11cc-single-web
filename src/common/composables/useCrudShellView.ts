import { computed, useSlots } from 'vue'
import { useRoute } from 'vue-router'
import { useTableColumns } from './useTableColumns'
import type { TableColumnDef } from './useTableColumns'

/**
 * 列表壳 / 树形壳共用的视图层逻辑。
 *
 * 两个壳的表格主体与数据源不同，但「列偏好、cell-* 插槽转发、冷启动判定」
 * 这三件事完全一样，抽出来避免各写一份。
 *
 * 冷启动判定之所以要传 getter 而不是直接传值：两个壳的字段名不同
 * （tableLoading/tableData/tableError vs loading/treeData/treeError），
 * 但判定规则一致——「加载中 且 无数据 且 非失败态」。
 */
export function useCrudShellView(options: {
  /** 列定义 getter（保持响应性，label 随 i18n 变化） */
  columns: () => TableColumnDef[]
  /** 列偏好持久化键；不传则用当前路由名 */
  columnKey: () => string | undefined
  /** 是否正在加载 */
  isLoading: () => boolean
  /** 当前是否没有任何数据 */
  isEmpty: () => boolean
  /** 是否处于失败态 */
  hasError: () => boolean
}) {
  const route = useRoute()

  const columnSetting = useTableColumns({
    key: options.columnKey() || (route?.name ? String(route.name) : 'crud'),
    columns: options.columns,
  })

  const slots = useSlots()
  /** 只转发 cell-* 插槽，避免把 search-form / actions 等无关插槽也带下去 */
  const cellSlotNames = computed(() => Object.keys(slots).filter((n) => n.startsWith('cell-')))

  /**
   * 冷启动：加载中且没有任何数据（且不是失败态）。
   * 这是唯一使用骨架屏的场景——有旧数据时继续用扫描线，翻页不会整表消失。
   */
  const isColdLoading = computed(
    () => options.isLoading() && options.isEmpty() && !options.hasError(),
  )

  return { columnSetting, cellSlotNames, isColdLoading }
}
