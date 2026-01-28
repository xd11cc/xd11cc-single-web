interface PaginationData {
  total?: number
  currentPage?: number
  pageSizes?: number[]
  pageSize?: number
  layout?: string
}

const DEFAULT_PAGINATION_DATA = {
  total: 0,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  pageSize: 10,
  layout: 'total, sizes, prev, pager, next, jumper',
}

/**
 * 分页 Composable
 * @param initPaginationData
 */
export function usePagination(initPaginationData: PaginationData = {}) {
  // 合并分页参数
  const paginationData = reactive({ ...DEFAULT_PAGINATION_DATA, ...initPaginationData })

  // 改变当前页码
  const handleCurrentChange = (value: number) => {
    paginationData.currentPage = value
  }

  // 改变每页显示条数
  const handleSizeChange = (value: number) => {
    paginationData.pageSize = value
  }

  return { paginationData, handleCurrentChange, handleSizeChange }
}
