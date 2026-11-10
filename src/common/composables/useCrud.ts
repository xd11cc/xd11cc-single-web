import type { ComponentPublicInstance } from 'vue'
import { reactive, ref, watch, onMounted, onScopeDispose } from 'vue'
import { useLatestRequest } from './useLatestRequest'
import type { ResponseVO } from 'types/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { BaseCrudOptions } from './crud-types'

/**
 * 业务分页接口返回结构
 */
export interface PageData<T> {
  rows: T[]
  total: number
}

/**
 * useCrud 配置项（分页列表）
 *
 * 新增/修改/载荷转换/删除确认/弹窗回调 等字段来自 {@link BaseCrudOptions}，与树形壳共用。
 */
export interface UseCrudOptions<Q = any, T = any>
  extends BaseCrudOptions<{
    isAdd: boolean
    form: Record<string, any>
    row?: any
    /** 本次弹窗会话号：异步回填返回后用它判断弹窗是否已被重新打开 */
    session: number
  }> {
  /** 分页查询接口 */
  pageApi: (query: Q) => Promise<ResponseVO<PageData<T>>>
  /** 删除接口（接收逗号拼接的 id 字符串） */
  removeApi?: (ids: string) => Promise<ResponseVO<any>>
  /** 查询条件默认值 */
  defaultQuery?: () => Q
  /** 批量删除的确认文案，默认使用通用文案 */
  batchRemoveConfirmText?: (count: number) => string
}

/**
 * slotProps 完整类型（供 #search-form / #actions / #table / #form-fields 消费）
 *
 * @typeParam Q 查询条件（#search-form 里的 searchData）
 * @typeParam T 列表行（tableData / handleEdit 等）
 */
export interface UseCrudSlotProps<Q = any, T = any> {
  searchData: Q
  /** 主动重新拉取当前页数据（自定义动作后刷新用） */
  refresh: () => Promise<void>
  handleSearch: () => void
  resetSearch: () => void
  tableData: T[]
  tableLoading: boolean
  /** 最近一次加载是否失败（提示已由 request 层弹出） */
  tableError: boolean
  tableSelection: T[]
  handleSelectionChange: (rows: T[]) => void
  paginationData: {
    total: number
    currentPage: number
    pageSize: number
    pageSizes: number[]
    layout: string
  }
  handleCurrentChange: (page: number) => void
  handleSizeChange: (size: number) => void
  /** 表单对象：新增时字段不全，因此是 Partial；同时保留索引签名以容纳字典/关联字段 */
  formData: Partial<T> & Record<string, any>
  dialogVisible: boolean
  /** 当前弹窗会话号：异步回调可用它判断弹窗是否已被重新打开 */
  readonly sessionId: number
  handleAdd: () => void
  handleEdit: (row: T) => void
  handleRemove: (row: T) => Promise<void>
  handleBatchRemove: () => Promise<void>
  handleClose: () => void
  handleSubmit: (isAdd: boolean) => Promise<ResponseVO<any> | void>
  rowSelection: T[]
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
  /** 列表加载失败（数据未更新，供页面显示错误态/重试） */
  const tableError = ref(false)
  const tableSelection = ref<T[]>([])
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
  const request = useLatestRequest()
  /** 弹窗会话号：提交返回时用它判断这次提交是否已经过期 */
  const dialogSessionId = ref(0)

  onScopeDispose(() => {
    dialogSessionId.value++
  })

  // ─── 生命周期 ──────────────────────────────────────────
  onMounted(() => getTableData())
  // 页码与每页条数合并成一个 watcher。
  // 分开监听时，「在第 2 页改每页条数」会在同一 tick 内让两个 watcher 各触发一次：
  // handleSizeChange 先把 currentPage 置 1，pageSize 的 watcher 读到的 wasFirstPage 已是 true，
  // 于是它自己发一次请求，currentPage 的 watcher 又发一次 —— 两次参数完全相同。
  // 合并后 Vue 的批量更新只会触发一次。
  watch([() => paginationData.currentPage, () => paginationData.pageSize], () => {
    void getTableData()
  })

  // ─── 数据获取 ──────────────────────────────────────────
  async function getTableData() {
    if (request.isDisposed()) return

    const requestId = request.begin()
    const isLatestRequest = () => request.isCurrent(requestId)

    tableLoading.value = true
    tableError.value = false
    try {
      const { data } = await options.pageApi({
        ...searchData,
        currentPage: paginationData.currentPage,
        pageSize: paginationData.pageSize,
      } as Q)
      if (!isLatestRequest()) return

      tableData.value = data.rows
      paginationData.total = data.total
    } catch {
      if (isLatestRequest()) {
        tableError.value = true
      }
    } finally {
      if (isLatestRequest()) {
        tableLoading.value = false
      }
    }
  }

  // ─── 搜索 ──────────────────────────────────────────────
  function handleSearch() {
    const wasFirstPage = paginationData.currentPage === 1
    paginationData.currentPage = 1
    if (wasFirstPage) getTableData()
  }

  function resetSearch() {
    // 按 key 逐个清空再回填默认值，没用 el-form 的 resetFields：
    // 它只处理声明了 prop 的字段，未声明 prop 的查询条件会残留下来。
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
    dialogSessionId.value++
    formData.value = options.defaultForm?.() || {}
    dialogVisible.value = true
    options.onDialogOpen?.({ isAdd: true, form: formData.value, session: dialogSessionId.value })
  }

  function handleEdit(row: T) {
    dialogSessionId.value++
    formData.value = { ...row }
    dialogVisible.value = true
    options.onDialogOpen?.({
      isAdd: false,
      form: formData.value,
      row,
      session: dialogSessionId.value,
    })
  }

  function handleClose() {
    dialogSessionId.value++
    formData.value = options.defaultForm?.() || {}
    dialogVisible.value = false
  }

  // ─── 单条删除 ──────────────────────────────────────────
  /** 行类型未必声明 id（部分列表用 taskId 等），删除时按约定的 id 字段取 */
  const readRowId = (row: unknown) => (row as { id?: number | string } | null)?.id

  async function handleRemove(row: T): Promise<void> {
    // 只读列表可以不配置删除接口；此时删除动作应是无操作，而非打开确认框后报错。
    const removeApi = options.removeApi
    if (request.isDisposed() || !removeApi) return

    const confirmText = options.removeConfirmText?.(row) ?? t('common.messages.deleteConfirm')
    try {
      await ElMessageBox.confirm(confirmText, t('common.messages.confirmTitle'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      })
    } catch {
      // 用户取消时 ElMessageBox 会 reject；取消不应产生未处理的 rejection。
      return
    }

    // 用户可能在确认框打开期间离开列表；确认结果返回后必须重新校验生命周期。
    if (request.isDisposed()) return

    try {
      const res = await removeApi(String(readRowId(row)))
      if (request.isDisposed()) return
      ElMessage.success(res.msg || t('common.messages.deleteSuccess'))
      await getTableData()
    } catch {
      // request 层负责显示请求错误；这里收口 rejection，避免事件处理器留下未处理异常。
      return
    }
  }

  // ─── 批量删除 ──────────────────────────────────────────
  async function handleBatchRemove(): Promise<void> {
    const removeApi = options.removeApi
    if (request.isDisposed() || !removeApi) return

    const ids = tableSelection.value.map((r) => readRowId(r)).join(',')
    if (!ids) {
      ElMessage.warning(t('common.messages.selectFirst'))
      return
    }
    const count = tableSelection.value.length
    const confirmText =
      options.batchRemoveConfirmText?.(count) ?? t('common.messages.deleteSelected', { count })

    try {
      await ElMessageBox.confirm(confirmText, t('common.messages.confirmTitle'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      })
    } catch {
      // 取消批量删除同样会产生 reject，一并接住。
      return
    }

    if (request.isDisposed()) return

    try {
      const res = await removeApi(ids)
      if (request.isDisposed()) return
      ElMessage.success(res.msg || t('common.messages.deleteSuccess'))
      tableSelection.value = []
      await getTableData()
    } catch {
      // request 层负责显示请求错误；这里收口 rejection。
      return
    }
  }

  // ─── 提交（校验 + API 调用 + 成功/失败处理） ──────────
  function handleSubmit(isAdd: boolean): Promise<ResponseVO<any> | void> {
    const api = isAdd ? options.addApi : options.updateApi
    if (!api) return Promise.resolve()
    const payload = options.transformPayload?.(formData.value, isAdd) ?? { ...formData.value }
    const sessionId = dialogSessionId.value
    return api(payload)
      .then((res) => {
        ElMessage.success(res.msg || t('common.messages.operationSuccess'))
        // 请求期间用户可能已关掉弹窗、甚至打开了另一行的编辑弹窗；
        // 只有会话未变时才关闭，否则会把新弹窗一起关掉
        if (sessionId === dialogSessionId.value) {
          dialogVisible.value = false
        }
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
  function handleSelectionChange(rows: T[]) {
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
    get tableError() {
      return tableError.value
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
    get sessionId() {
      return dialogSessionId.value
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
  } as UseCrudSlotProps<Q, T>)

  // 对外只暴露三条路径，避免同一能力暴露多次：
  //   slotProps —— 模板消费（绑定到壳、或从插槽作用域取动作）
  //   refresh   —— 脚本里主动重新拉取（自定义动作后刷新）
  //   state     —— 脚本里读写弹窗内部状态（回填联动数据、监听切换）
  return {
    slotProps,
    refresh: getTableData,
    state: {
      formData,
      dialogVisible,
      /** 当前弹窗会话号（打开/关闭都会变） */
      get sessionId() {
        return dialogSessionId.value
      },
      /** 该会话号是否仍是当前弹窗：异步回填返回后用它判断结果是否已过期 */
      isCurrentSession: (session: number) => session === dialogSessionId.value,
    },
  }
}
