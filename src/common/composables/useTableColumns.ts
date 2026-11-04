import { ref, computed } from 'vue'
import { CacheKey } from '@@/constants/cache-key'

/** 列定义（页面侧提供，只包含"这一列长什么样"，不含用户偏好） */
export interface TableColumnDef {
  /** 字段名：既是取值键，也是用户偏好的持久化键与单元格插槽名后缀 */
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right' | boolean
  /** 默认是否显示，默认 true */
  visible?: boolean
}

/** 列配置（列定义 + 用户偏好：显示、宽度、顺序） */
export interface TableColumnConfig extends TableColumnDef {
  visible: boolean
  order: number
}

interface UseTableColumnsOptions {
  /** 持久化键：不同页面的列偏好互不干扰 */
  key: string
  defaultColumns: TableColumnDef[]
}

/** 只持久化用户能改的三项，label 等展示信息始终以代码里的定义为准 */
interface StoredColumn {
  prop: string
  visible?: boolean
  width?: number | string
  order?: number
}

export function useTableColumns(options: UseTableColumnsOptions) {
  const storageKey = `${CacheKey.TABLE_COLUMNS}-${options.key}`

  const columns = ref<TableColumnConfig[]>(loadColumns())

  /** 可见列，按用户排序 */
  const visibleColumns = computed(() =>
    columns.value.filter((col) => col.visible).sort((a, b) => a.order - b.order),
  )

  function readStored(): StoredColumn[] {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      // 数据损坏（截断 / 手改）时按没有偏好处理，不让整个列表挂掉
      return []
    }
  }

  /**
   * 合并「代码里的列定义」与「用户偏好」。
   *
   * 两个容易出错的点：
   *  1. 代码新增了列：旧偏好里没有它，必须追加到末尾，不能按数组下标硬套
   *     （否则新列会插到中间，甚至与已有的 order 撞车）。
   *  2. 代码删了列：偏好里残留的 prop 直接忽略，不要还原出幽灵列。
   */
  function loadColumns(): TableColumnConfig[] {
    const stored = readStored()
    const storedByProp = new Map(stored.map((item) => [item.prop, item]))
    // 新列从「已有偏好的最大 order + 1」开始排，避免与老列撞车
    let nextOrder = stored.reduce((max, item) => Math.max(max, item.order ?? -1), -1) + 1

    return options.defaultColumns.map((def) => {
      const saved = storedByProp.get(def.prop)
      return {
        ...def,
        visible: saved?.visible ?? def.visible ?? true,
        width: saved?.width ?? def.width,
        order: saved?.order ?? nextOrder++,
      } satisfies TableColumnConfig
    })
  }

  function saveColumns() {
    const payload: StoredColumn[] = columns.value.map(({ prop, visible, width, order }) => ({
      prop,
      visible,
      width,
      order,
    }))
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {
      // 隐私模式 / 超配额：偏好存不下不影响本次使用
    }
  }

  /** 切换显示；至少要保留一列，否则表格会变成空壳 */
  function toggleColumn(prop: string): boolean {
    const col = columns.value.find((c) => c.prop === prop)
    if (!col) return false
    if (col.visible && visibleColumns.value.length <= 1) return false
    col.visible = !col.visible
    saveColumns()
    return true
  }

  /** 记录表头拖拽后的列宽（由 el-table 的 header-dragend 事件驱动） */
  function setColumnWidth(prop: string, width: number | string) {
    const col = columns.value.find((c) => c.prop === prop)
    if (!col || col.width === width) return
    col.width = width
    saveColumns()
  }

  /** 把第 from 个可见列移动到第 to 个位置 */
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
    sorted.forEach((col, index) => (col.order = index))
    // 隐藏列排在可见列之后，保持相对顺序，避免下次显示时插进可见列中间
    columns.value
      .filter((col) => !col.visible)
      .sort((a, b) => a.order - b.order)
      .forEach((col, index) => (col.order = sorted.length + index))
    columns.value = [...columns.value]
    saveColumns()
  }

  /** 恢复代码里的默认列定义，并清掉本地偏好 */
  function resetColumns() {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
    columns.value = options.defaultColumns.map((col, index) => ({
      ...col,
      visible: col.visible ?? true,
      order: index,
    }))
  }

  return {
    columns,
    visibleColumns,
    toggleColumn,
    setColumnWidth,
    reorderColumns,
    resetColumns,
  }
}
