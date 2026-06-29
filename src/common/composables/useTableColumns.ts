import { CacheKey } from '@@/constants/cache-key'

export interface TableColumnConfig {
  prop: string
  label: string
  visible: boolean
  width?: number
  fixed?: 'left' | 'right' | boolean
  order: number
}

interface UseTableColumnsOptions {
  key: string
  defaultColumns: Omit<TableColumnConfig, 'order' | 'visible'>[]
}

export function useTableColumns(options: UseTableColumnsOptions) {
  const storageKey = `${CacheKey.TABLE_COLUMNS}-${options.key}`

  const columns = ref<TableColumnConfig[]>(loadColumns())

  const visibleColumns = computed(() =>
    columns.value
      .filter((col) => col.visible)
      .sort((a, b) => a.order - b.order),
  )

  function loadColumns(): TableColumnConfig[] {
    const cached = localStorage.getItem(storageKey)
    if (cached) {
      try {
        const parsed: TableColumnConfig[] = JSON.parse(cached)
        const defaults = options.defaultColumns
        return defaults.map((def, i) => {
          const saved = parsed.find((c) => c.prop === def.prop)
          return {
            ...def,
            visible: saved?.visible ?? true,
            width: saved?.width ?? def.width,
            order: saved?.order ?? i,
          }
        })
      } catch {
        // fall through
      }
    }
    return options.defaultColumns.map((col, i) => ({
      ...col,
      visible: true,
      order: i,
    }))
  }

  function saveColumns() {
    localStorage.setItem(storageKey, JSON.stringify(columns.value))
  }

  function toggleColumn(prop: string) {
    const col = columns.value.find((c) => c.prop === prop)
    if (col) {
      col.visible = !col.visible
      saveColumns()
    }
  }

  function updateColumnWidth(prop: string, width: number) {
    const col = columns.value.find((c) => c.prop === prop)
    if (col) {
      col.width = width
      saveColumns()
    }
  }

  function reorderColumns(fromIndex: number, toIndex: number) {
    const sorted = [...columns.value].sort((a, b) => a.order - b.order)
    const [moved] = sorted.splice(fromIndex, 1)
    sorted.splice(toIndex, 0, moved)
    sorted.forEach((col, i) => (col.order = i))
    columns.value = [...columns.value]
    saveColumns()
  }

  function resetColumns() {
    columns.value = options.defaultColumns.map((col, i) => ({
      ...col,
      visible: true,
      order: i,
    }))
    saveColumns()
  }

  return {
    columns,
    visibleColumns,
    toggleColumn,
    updateColumnWidth,
    reorderColumns,
    resetColumns,
  }
}
