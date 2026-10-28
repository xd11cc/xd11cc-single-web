import type { ComponentPublicInstance } from 'vue'
import { reactive, ref, watch, onMounted } from 'vue'
import type { ResponseVO } from 'types/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

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
  addApi?: (data: any) => Promise<ResponseVO<any>>
  /** 修改接口 */
  updateApi?: (data: any) => Promise<ResponseVO<any>>
  /** 删除接口（接收逗号拼接的 id 字符串） */
  removeApi?: (ids: string) => Promise<ResponseVO<any>>
  /**
   * 提交前转换 formData 为 API 需要的载荷
   * 用于补充 deptName / postName 等关联字段
   */
  transformPayload?: (form: any, isAdd: boolean) => any
  /** 新增/修改共用默认表单 */
  defaultForm?: () => Record<string, any>
  /** 查询条件默认值 */
  defaultQuery?: () => Q
  /** 单条删除的确认文案，默认使用通用文案 */
  removeConfirmText?: (row: any) => string
  /** 批量删除的确认文案，默认使用通用文案 */
  batchRemoveConfirmText?: (count: number) => string
  /**
   * 弹窗打开后的钩子（新增 / 编辑共用）。
   *
   * 用于「表单需要按当前行回填联动数据」的场景：部门树勾选、岗位下拉列表、
   * dataScope 默认值等。调用时机是 formData 已赋值、dialogVisible 已置 true、
   * 但 DOM 尚未更新——需要操作弹窗内组件时请自行 nextTick。
   *
   * 不要通过替换返回对象上的方法来扩展行为：那会绕过这份契约，
   * 且 slotProps 里保存的仍是原函数引用，替换不会生效。
   */
  onDialogOpen?: (context: { isAdd: boolean; form: Record<string, any>; row?: any }) => void
}

/**
 * slotProps 完整类型（供 #search-form / #actions / #table / #form-fields 消费）
 */
export interface UseCrudSlotProps {
  searchData: any
  /** 主动重新拉取当前页数据（自定义动作后刷新用） */
  refresh: () => Promise<void>
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
  handleSubmit: (isAdd: boolean) => Promise<ResponseVO<any> | void>
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
  const { t } = useI18n()
  // ─── 表格 / 分页 ──────────────────────────────────────
  const tableData = ref<T[]>([])
  const tableLoading = ref(false)
  const tableSelection = ref<any[]>([])
  const paginationData = reactive({
    total: 0,
    currentPage: 1,
    pageSize: 10,
    pageSizes: [10, 20, 50],
    layout: 'total, sizes, prev, pager, next, jumper',
  })

  // ─── 搜索 ─────────────────────────────────────────────
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
      const wasFirstPage = paginationData.currentPage === 1
      paginationData.currentPage = 1
      if (wasFirstPage) getTableData()
    },
  )

  // ─── 数据获取 ──────────────────────────────────────────
  async function getTableData() {
    tableLoading.value = true
    try {
      const { data } = await options.pageApi({
        ...searchData,
        currentPage: paginationData.currentPage,
        pageSize: paginationData.pageSize,
      } as Q)
      tableData.value = data.rows
      paginationData.total = data.total
    } finally {
      tableLoading.value = false
    }
  }

  // ─── 搜索 ──────────────────────────────────────────────
  function handleSearch() {
    const wasFirstPage = paginationData.currentPage === 1
    paginationData.currentPage = 1
    if (wasFirstPage) getTableData()
  }

  function resetSearch() {
    // 逐个删除而不是依赖 el-form 的 resetFields：
    // 1) resetFields 只处理声明了 prop 的字段，未声明 prop 的条件会残留；
    // 2) 此前组合式函数里的 searchFormRef 从未绑定到 <el-form>，
    //    resetFields 一直没执行，导致「重置」按钮点了没反应。
    Object.keys(searchData as any).forEach((key) => {
      delete (searchData as any)[key]
    })
    Object.assign(searchData as any, options.defaultQuery?.() || {})
    const wasFirstPage = paginationData.currentPage === 1
    paginationData.currentPage = 1
    if (wasFirstPage) getTableData()
  }

  // ─── 弹窗开关 ──────────────────────────────────────────
  function handleAdd() {
    formData.value = options.defaultForm?.() || {}
    dialogVisible.value = true
    options.onDialogOpen?.({ isAdd: true, form: formData.value })
  }

  function handleEdit(row: T) {
    formData.value = { ...row }
    dialogVisible.value = true
    options.onDialogOpen?.({ isAdd: false, form: formData.value, row })
  }

  function handleClose() {
    formData.value = options.defaultForm?.() || {}
    dialogVisible.value = false
  }

  // ─── 单条删除 ──────────────────────────────────────────
  function handleRemove(row: any) {
    const confirmText = options.removeConfirmText?.(row) ?? t('common.messages.deleteConfirm')
    ElMessageBox.confirm(confirmText, t('common.messages.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    }).then(() => {
      options
        .removeApi?.(String(row.id))
        .then((res) => {
          ElMessage.success(res.msg || t('common.messages.deleteSuccess'))
          getTableData()
        })
        .catch(() => {})
    })
  }

  // ─── 批量删除 ──────────────────────────────────────────
  function handleBatchRemove() {
    const ids = tableSelection.value.map((r: any) => r.id).join(',')
    if (!ids) {
      ElMessage.warning(t('common.messages.selectFirst'))
      return
    }
    const count = tableSelection.value.length
    const confirmText =
      options.batchRemoveConfirmText?.(count) ?? t('common.messages.deleteSelected', { count })
    ElMessageBox.confirm(confirmText, t('common.messages.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    }).then(() => {
      options
        .removeApi?.(ids)
        .then((res) => {
          ElMessage.success(res.msg || t('common.messages.deleteSuccess'))
          tableSelection.value = []
          getTableData()
        })
        .catch(() => {})
    })
  }

  // ─── 提交（校验 + API 调用 + 成功/失败处理） ──────────
  function handleSubmit(isAdd: boolean): Promise<ResponseVO<any> | void> {
    const api = isAdd ? options.addApi : options.updateApi
    if (!api) return Promise.resolve()
    const payload = options.transformPayload?.(formData.value, isAdd) ?? { ...formData.value }
    return api(payload)
      .then((res) => {
        ElMessage.success(res.msg || t('common.messages.operationSuccess'))
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
    refresh: getTableData,
    handleSearch,
    resetSearch,
    get tableData() {
      return tableData.value
    },
    get tableLoading() {
      return tableLoading.value
    },
    get tableSelection() {
      return tableSelection.value
    },
    handleSelectionChange,
    paginationData,
    handleCurrentChange,
    handleSizeChange,
    get formData() {
      return formData.value
    },
    get dialogVisible() {
      return dialogVisible.value
    },
    set dialogVisible(val: boolean) {
      dialogVisible.value = val
    },
    handleAdd,
    handleEdit,
    handleRemove,
    handleBatchRemove,
    handleClose,
    handleSubmit,
    get rowSelection() {
      return tableSelection.value
    },
  } as UseCrudSlotProps)

  // 对外只暴露三条路径，避免同一能力暴露多次：
  //   slotProps —— 模板消费（绑定到壳、或从插槽作用域取动作）
  //   refresh   —— 脚本里主动重新拉取（自定义动作后刷新）
  //   state     —— 脚本里读写弹窗内部状态（回填联动数据、监听切换）
  return {
    slotProps,
    refresh: getTableData,
    state: { formData, dialogVisible },
  }
}
