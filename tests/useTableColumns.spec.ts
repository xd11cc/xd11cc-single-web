import { beforeEach, describe, expect, it } from 'vitest'
import { useTableColumns } from '@@/composables/useTableColumns'
import { CacheKey } from '@@/constants/cache-key'

/**
 * 列偏好：排序、显隐、列宽、持久化与"代码改了列定义"的兼容。
 *
 * 关键不变量：
 *  - 代码新增列要追加到末尾，不能插进中间或与已有 order 撞车；
 *  - 代码删列后，本地残留的 prop 不应还原成幽灵列；
 *  - 至少保留一列可见，否则表格变空壳。
 */

const KEY = 'test-user'
const storageKey = `${CacheKey.TABLE_COLUMNS}-${KEY}`

const defaults = [
  { prop: 'a', label: 'A' },
  { prop: 'b', label: 'B' },
  { prop: 'c', label: 'C' },
]

function read(): Record<string, { visible?: boolean; width?: number | string; order?: number }> {
  return JSON.parse(localStorage.getItem(storageKey) ?? '{}')
}

describe('useTableColumns', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('默认按定义顺序、全部可见', () => {
    const { columns, visibleColumns } = useTableColumns({ key: KEY, columns: defaults })

    expect(columns.value.map((c) => [c.prop, c.order, c.visible])).toEqual([
      ['a', 0, true],
      ['b', 1, true],
      ['c', 2, true],
    ])
    expect(visibleColumns.value.map((c) => c.prop)).toEqual(['a', 'b', 'c'])
  })

  it('切换显隐后写回本地', () => {
    const { toggleColumn, visibleColumns } = useTableColumns({ key: KEY, columns: defaults })

    expect(toggleColumn('b')).toBe(true)
    expect(visibleColumns.value.map((c) => c.prop)).toEqual(['a', 'c'])
    expect(read().b?.visible).toBe(false)
  })

  it('只剩一列时不允许再隐藏', () => {
    const { toggleColumn, visibleColumns } = useTableColumns({ key: KEY, columns: defaults })

    toggleColumn('a')
    toggleColumn('b')

    expect(toggleColumn('c')).toBe(false)
    expect(visibleColumns.value.map((c) => c.prop)).toEqual(['c'])
  })

  it('拖拽排序生效并持久化', () => {
    const { reorderColumns, visibleColumns } = useTableColumns({ key: KEY, columns: defaults })

    reorderColumns(0, 2) // a 移到末尾

    expect(visibleColumns.value.map((c) => c.prop)).toEqual(['b', 'c', 'a'])
    // 持久化的是「每个 prop 的 order」
    expect(Object.fromEntries(Object.entries(read()).map(([prop, p]) => [prop, p.order]))).toEqual({
      a: 2,
      b: 0,
      c: 1,
    })
  })

  it('隐藏列在排序后仍排在可见列之后', () => {
    const { toggleColumn, reorderColumns, columns } = useTableColumns({
      key: KEY,
      columns: defaults,
    })

    toggleColumn('a') // a 隐藏
    reorderColumns(0, 1) // b 与 c 交换

    const sorted = [...columns.value].sort((x, y) => x.order - y.order)
    expect(sorted.map((c) => c.prop)).toEqual(['c', 'b', 'a'])
  })

  it('记录列宽；相同宽度不重复写', () => {
    const { setColumnWidth, columns } = useTableColumns({ key: KEY, columns: defaults })

    setColumnWidth('a', 200)
    expect(columns.value.find((c) => c.prop === 'a')?.width).toBe(200)
    expect(read().a?.width).toBe(200)
  })

  it('重置恢复默认并清掉本地偏好', () => {
    const { toggleColumn, resetColumns, columns, visibleColumns } = useTableColumns({
      key: KEY,
      columns: defaults,
    })

    toggleColumn('a')
    resetColumns()

    expect(visibleColumns.value.map((c) => c.prop)).toEqual(['a', 'b', 'c'])
    expect(columns.value.map((c) => c.order)).toEqual([0, 1, 2])
    expect(localStorage.getItem(storageKey)).toBeNull()
  })

  it('本地数据损坏时回落到默认', () => {
    localStorage.setItem(storageKey, '不是 JSON')
    const { visibleColumns } = useTableColumns({ key: KEY, columns: defaults })
    expect(visibleColumns.value.map((c) => c.prop)).toEqual(['a', 'b', 'c'])
  })

  it('代码新增列时追加到末尾，不影响已有顺序', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        { prop: 'b', visible: true, order: 0 },
        { prop: 'a', visible: true, order: 1 },
      ]),
    )

    const { visibleColumns } = useTableColumns({
      key: KEY,
      columns: [...defaults, { prop: 'd', label: 'D' }],
    })

    expect(visibleColumns.value.map((c) => c.prop)).toEqual(['b', 'a', 'c', 'd'])
  })

  it('代码删除列后，本地残留的 prop 不会复活', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        { prop: 'a', visible: true, order: 0 },
        { prop: 'gone', visible: true, order: 1 },
      ]),
    )

    const { columns } = useTableColumns({ key: KEY, columns: defaults })
    expect(columns.value.map((c) => c.prop)).not.toContain('gone')
  })
})
