import type { ComponentPublicInstance } from 'vue'
import { reactive, ref, watch, onMounted } from 'vue'
import type { ResponseVO } from 'types/api'
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * 业务分页接口返回结构
 */
export interface PageData<T> {
  rows: T[]
  total: number
}

/**
 * useCrud 配置项
 */
export interface UseCrudOptions<Q = any, T = any> {
  /** 分页查询接口 */
  pageApi: (query: Q) => Promise<ResponseVO<PageData<T>>>
  /** 新增接口 */
  addApi?: (data: any) => Promise<ResponseVO<number>>
  /** 修改接口 */
  updateApi?: (data: any) => Promise<ResponseVO<number>>
  /** 删除接口（接收逗号拼接的 id 字符串） */
  removeApi?: (ids: string) => Promise<ResponseVO<number>>
  /**
   * 提交前转换 formData 为 API 需要的载荷
   * 用于补充 deptName / postName 等关联字段
   */
  transformPayload?: (form: any, isAdd: boolean) => any
  /** 新增/修改共用默认表单 */
  defaultForm?: () => Record<string, any>
  /** 查询条件默认值 */
  defaultQuery?: () => Q
}

/**
 * slotProps 完整类型（供 #search-form / #actions / #table / #form-fields 消费）
 */
export interface UseCrudSlotProps {
  searchData: any
  handleSearch: () => void
  resetSearch: () => void
  tableData: any[]
  tableLoading: boolean
  tableSelection: any[]
  handleSelectionChange: (rows: any[]) => void
  paginationData: {
    total: number
    currentPage: number
    pageSize: number
    pageSizes: number[]
    layout: string
  }
  handleCurrentChange: (page: number) => void
  handleSizeChange: (size: number) => void
  formData: any
  dialogVisible: boolean
  handleAdd: () => void
  handleEdit: (row: any) => void
  handleRemove: (row: any) => void
  handleBatchRemove: () => void
  handleClose: () => void
  handleSubmit: (isAdd: boolean) => Promise<ResponseVO<number> | void>
  rowSelection: any[]
}

/**
 * CRUD 逻辑层（状态 + 方法）
 *
 * 使用方式：
 *   1. `const crud = useCrud({ pageApi, addApi, updateApi, removeApi, ... })`
 *   2. 模板里 `<UseCrudView :slotProps="crud.slotProps" :formRules="formRules" />`
 *   3. 通过四个 slot 注入差异部分：
 *      - #search-form  搜索区字段
 *      - #actions      工具栏按钮
 *      - #table        表格列
 *      - #form-fields  弹窗表单字段
 */
export function useCrud<Q = any, T = any>(options: UseCrudOptions<Q, T>) {
  // ─── 表格 / 分页 ──────────────────────────────────────
  const tableData = ref<T[]>([])
  const tableLoading = ref(false)
  const tableSelection = ref<any[]>([])
  const paginationData = reactive({
    total: 0,
    currentPage: 1,
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper',
  })

  // ─── 搜索 ─────────────────────────────────────────────
  const searchFormRef = ref<any>(null)
  const searchData = reactive(options.defaultQuery?.() || {}) as Q

  // ─── 弹窗 ─────────────────────────────────────────────
  const dialogVisible = ref(false)
  const formData = ref<any>(options.defaultForm?.() || {})

  // ─── 生命周期 ──────────────────────────────────────────
  onMounted(() => getTableData())
  watch(() => paginationData.currentPage, getTableData)
  watch(
    () => paginationData.pageSize,
    () => {
      paginationData.currentPage = 1
      getTableData()
    },
  )

  // ─── 数据获取 ──────────────────────────────────────────
  async function getTableData() {
    tableLoading.value = true
    try {
      const { data } = await options.pageApi({ ...searchData } as Q)
      tableData.value = data.rows
      paginationData.total = data.total
    } finally {
      tableLoading.value = false
    }
  }

  // ─── 搜索 ──────────────────────────────────────────────
  function handleSearch() {
    paginationData.currentPage = 1
    getTableData()
  }

  function resetSearch() {
    searchFormRef.value?.resetFields?.()
    Object.assign(searchData as any, options.defaultQuery?.() || {})
    paginationData.currentPage = 1
    getTableData()
  }

  // ─── 弹窗开关 ──────────────────────────────────────────
  function handleAdd() {
    formData.value = options.defaultForm?.() || {}
    dialogVisible.value = true
  }

  function handleEdit(row: T) {
    formData.value = { ...row }
    dialogVisible.value = true
  }

  function handleClose() {
    formData.value = options.defaultForm?.() || {}
  }

  // ─── 单条删除 ──────────────────────────────────────────
  function handleRemove(row: any) {
    ElMessageBox.confirm('确认删除该条记录？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      options
        .removeApi?.(String(row.id))
        .then((res) => {
          ElMessage.success(res.msg || '删除成功')
          getTableData()
        })
        .catch(() => {})
    })
  }

  // ─── 批量删除 ──────────────────────────────────────────
  function handleBatchRemove() {
    const ids = tableSelection.value.map((r: any) => r.id).join(',')
    if (!ids) {
      ElMessage.warning('请先选择要删除的记录')
      return
    }
    ElMessageBox.confirm(`确认删除选中的 ${tableSelection.value.length} 条记录？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      options
        .removeApi?.(ids)
        .then((res) => {
          ElMessage.success(res.msg || '批量删除成功')
          tableSelection.value = []
          getTableData()
        })
        .catch(() => {})
    })
  }

  // ─── 提交（校验 + API 调用 + 成功/失败处理） ──────────
  function handleSubmit(isAdd: boolean): Promise<ResponseVO<number> | void> {
    const api = isAdd ? options.addApi : options.updateApi
    if (!api) return Promise.resolve()
    const payload = options.transformPayload?.(formData.value, isAdd) ?? { ...formData.value }
    return api(payload)
      .then((res) => {
        ElMessage.success(res.msg || '操作成功')
        dialogVisible.value = false
        getTableData()
        return res
      })
      .catch(() => {})
  }

  // ─── 分页 ──────────────────────────────────────────────
  function handleCurrentChange(page: number) {
    paginationData.currentPage = page
  }

  function handleSizeChange(size: number) {
    paginationData.pageSize = size
    paginationData.currentPage = 1
  }

  // ─── 选择 ──────────────────────────────────────────────
  function handleSelectionChange(rows: any[]) {
    tableSelection.value = rows
  }

  // ─── 供模板消费的 slot props ───────────────────────────
  // 使用 reactive + getter，确保 slotProps.tableData / formData / dialogVisible 等
  // 始终返回 ref 的最新值，而非构造时快照。Vue 模板内 ref 自动解包。
  const slotProps = reactive({
    searchData,
    handleSearch,
    resetSearch,
    get tableData() { return tableData.value },
    get tableLoading() { return tableLoading.value },
    get tableSelection() { return tableSelection.value },
    handleSelectionChange,
    paginationData,
    handleCurrentChange,
    handleSizeChange,
    get formData() { return formData.value },
    get dialogVisible() { return dialogVisible.value },
    handleAdd,
    handleEdit,
    handleRemove,
    handleBatchRemove,
    handleClose,
    handleSubmit,
    get rowSelection() { return tableSelection.value },
  } as UseCrudSlotProps)

  return {
    state: {
      tableData,
      tableLoading,
      tableSelection,
      paginationData,
      searchFormRef,
      searchData,
      dialogVisible,
      formData,
    },
    methods: {
      getTableData,
      handleSearch,
      resetSearch,
      handleAdd,
      handleEdit,
      handleClose,
      handleRemove,
      handleBatchRemove,
      handleSubmit,
      handleCurrentChange,
      handleSizeChange,
      handleSelectionChange,
    },
    slotProps,
  }
}
