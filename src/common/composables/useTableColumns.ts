import { computed, ref, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { CacheKey } from '@@/constants/cache-key'

/** 列定义：页面侧唯一的输入，只描述"这一列长什么样" */
export interface TableColumnDef {
  /** 字段名：取值键 + 偏好键 + 单元格插槽名后缀 */
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right' | boolean
  /**
   * 内容超长时省略并用 tooltip 展示全文。
   * 默认开启（表格单元格全局 nowrap + 省略号，不开就永远看不到全文）；
   * 纯数值/标签列可显式设为 false。
   */
  showOverflowTooltip?: boolean
  /** 默认是否显示，默认 true */
  visible?: boolean
}

/** 合并后的列配置 = 定义 + 用户偏好 */
export interface TableColumnConfig extends TableColumnDef {
  visible: boolean
  order: number
}

/** 用户偏好：只存这三项，label 等展示信息始终以代码里的定义为准 */
interface ColumnPrefs {
  visible?: boolean
  width?: number | string
  order?: number
}

type PrefsMap = Record<string, ColumnPrefs>

interface UseTableColumnsOptions {
  /** 持久化键：不同页面的列偏好互不干扰 */
  key: string
  /**
   * 列定义来源。传函数/ref 而不是数组，是为了让 label 跟着 i18n 语言切换实时更新——
   * 列定义是"输入"，用户偏好才是需要保存的"状态"。
   */
  columns: MaybeRefOrGetter<TableColumnDef[]>
}

export function useTableColumns(options: UseTableColumnsOptions) {
  const storageKey = `${CacheKey.TABLE_COLUMNS}-${options.key}`

  const prefs = ref<PrefsMap>(readPrefs())

  const definitions = computed(() => toValue(options.columns) ?? [])

  /** 合并定义与偏好：没有偏好的列（代码新增的）排到末尾 */
  const columns = computed<TableColumnConfig[]>(() => {
    const storedOrders = Object.values(prefs.value)
      .map((item) => item.order)
      .filter((order): order is number => typeof order === 'number')
    let nextOrder = storedOrders.length ? Math.max(...storedOrders) + 1 : 0
    const usedOrders = new Set(storedOrders)

    return definitions.value.map((def) => {
      const saved = prefs.value[def.prop]
      let order = saved?.order
      if (order === undefined) {
        while (usedOrders.has(nextOrder)) nextOrder += 1
        order = nextOrder
        usedOrders.add(order)
        nextOrder += 1
      }
      return {
        ...def,
        visible: saved?.visible ?? def.visible ?? true,
        width: saved?.width ?? def.width,
        order,
      }
    })
  })

  const visibleColumns = computed(() =>
    columns.value.filter((col) => col.visible).sort((a, b) => a.order - b.order),
  )

  function readPrefs(): PrefsMap {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      // 兼容旧格式：早期存的是 [{ prop, visible, width, order }] 数组
      if (Array.isArray(parsed)) {
        return Object.fromEntries(
          parsed
            .filter((item) => item && typeof item.prop === 'string')
            .map(({ prop, ...rest }) => [prop, rest]),
        )
      }
      return parsed && typeof parsed === 'object' ? (parsed as PrefsMap) : {}
    } catch {
      // 数据损坏（截断 / 手改）时按没有偏好处理，不影响列表加载
      return {}
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(prefs.value))
    } catch {
      // 隐私模式 / 配额超限：偏好存不下不影响本次使用
    }
  }

  function patchPrefs(prop: string, patch: ColumnPrefs) {
    prefs.value = { ...prefs.value, [prop]: { ...prefs.value[prop], ...patch } }
    savePrefs()
  }

  /** 切换显示；至少保留一列，否则表格会变成空壳 */
  function toggleColumn(prop: string): boolean {
    const col = columns.value.find((item) => item.prop === prop)
    if (!col) return false
    if (col.visible && visibleColumns.value.length <= 1) return false
    patchPrefs(prop, { visible: !col.visible })
    return true
  }

  /** 记录表头拖拽后的列宽（由 el-table 的 header-dragend 驱动） */
  function setColumnWidth(prop: string, width: number | string) {
    const col = columns.value.find((item) => item.prop === prop)
    if (!col || col.width === width) return
    patchPrefs(prop, { width })
  }

  /**
   * el-table 的 `header-dragend` 事件处理器：把拖拽后的列宽写进偏好。
   * 放在组合式里，两个壳都直接绑它，避免同一段逻辑各写一份。
   */
  function onHeaderDragEnd(
    newWidth: number,
    _oldWidth: number,
    column: { property?: string } | undefined,
  ) {
    if (!column?.property) return
    setColumnWidth(column.property, newWidth)
  }

  /** 把第 from 个可见列移动到第 to 个位置（隐藏列统一排在可见列之后） */
  function reorderColumns(fromIndex: number, toIndex: number) {
    const sorted = [...visibleColumns.value]
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= sorted.length ||
      toIndex >= sorted.length ||
      fromIndex === toIndex
    ) {
      return
    }
    const [moved] = sorted.splice(fromIndex, 1)
    sorted.splice(toIndex, 0, moved)

    const next: PrefsMap = { ...prefs.value }
    sorted.forEach((col, index) => {
      next[col.prop] = { ...next[col.prop], order: index }
    })
    columns.value
      .filter((col) => !col.visible)
      .sort((a, b) => a.order - b.order)
      .forEach((col, index) => {
        next[col.prop] = { ...next[col.prop], order: sorted.length + index }
      })
    prefs.value = next
    savePrefs()
  }

  /** 清掉用户偏好，回到代码里的默认定义 */
  function resetColumns() {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
    prefs.value = {}
  }

  return {
    columns,
    visibleColumns,
    toggleColumn,
    setColumnWidth,
    onHeaderDragEnd,
    reorderColumns,
    resetColumns,
  }
}
