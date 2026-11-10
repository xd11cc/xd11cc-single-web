import type { ResponseVO } from 'types/api'
import { onScopeDispose, reactive, ref } from 'vue'
import { useLatestRequest } from './useLatestRequest'
import { useCrudDialog } from './useCrudDialog'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { BaseCrudOptions } from './crud-types'

/**
 * 树形列表的逻辑层（配合 TreeCrudView 使用）。
 *
 * 与 useCrud 的差异：
 *   - 没有分页：treeApi 一次返回整棵树
 *   - 新增支持「挂在某个节点下」：handleAddChild(row)
 *   - 删除按单条 id，且可配置前置校验（如「有子节点不允许删除」）
 *   - 展开/收起、行点击展开由 TreeCrudView 负责，这里不掺和 DOM
 */

export interface UseTreeCrudOptions<Q = any, T = any>
  extends BaseCrudOptions<{
    isAdd: boolean
    form: Record<string, any>
    parent?: any
    /** 本次弹窗会话号：异步回填返回后用它判断弹窗是否已被重新打开 */
    session: number
  }> {
  /** 树查询接口，返回完整层级数据（无分页） */
  treeApi: (query: Q) => Promise<ResponseVO<T[]>>
  /** 删除接口，接收单条 id */
  removeApi?: (id: number | string) => Promise<ResponseVO<any>>
  /**
   * 「新增子级」时的初始表单值。
   * 默认在 defaultForm 基础上补 parentId；需要按父节点类型推导默认值时（例如
   * 菜单：父级是目录则新增菜单、父级是菜单则新增按钮）在这里覆盖。
   */
  childForm?: (parent: any) => Record<string, any>
  /** 查询条件初始值；重置时恢复到这份值 */
  defaultQuery?: () => Q
  /**
   * 删除前置校验：返回字符串则中断删除并提示该文案。
   * 例：有子节点时不允许删除 → 返回「请先删除子节点」
   */
  removeGuard?: (row: any) => string | undefined
  /** 主键字段名，默认 id */
  idKey?: string
  /** 子节点字段名，默认 children */
  childrenKey?: string
}

export interface UseTreeCrudSlotProps<Q = any, T = any> {
  searchData: Q
  handleSearch: () => void
  resetSearch: () => void
  treeData: T[]
  loading: boolean
  treeError: boolean
  refresh: () => Promise<void>
  /** 表单对象：新增时字段不全，因此是 Partial；同时保留索引签名以容纳字典/关联字段 */
  formData: Partial<T> & Record<string, any>
  dialogVisible: boolean
  /** 当前弹窗会话号：异步回调可用它判断弹窗是否已被重新打开 */
  readonly sessionId: number
  handleAdd: () => void
  handleAddChild: (row: T) => void
  handleEdit: (row: T) => void
  handleRemove: (row: T) => void
  handleClose: () => void
  handleSubmit: (isAdd: boolean) => Promise<ResponseVO<any> | void>
  /** 当前弹窗是否为「新增子级」，可用于在表单里展示父级名称 */
  parentRow: T | null
}

export function useTreeCrud<Q = any, T = any>(options: UseTreeCrudOptions<Q, T>) {
  const { t } = useI18n()

  const idKey = options.idKey ?? 'id'
  /** 主键字段名可配置（idKey），因此这里按字符串取值 */
  const rowId = (row: T | null | undefined) =>
    (row as Record<string, unknown> | null | undefined)?.[idKey] as number | string | undefined
  const treeData = ref<T[]>([])
  const loading = ref(false)
  const treeError = ref(false)

  const searchData = reactive(options.defaultQuery?.() || {}) as Q

  const request = useLatestRequest()
  // 弹窗状态、会话号、提交守卫、删除确认统一走共享实现
  const dialog = useCrudDialog<T>({
    defaultForm: options.defaultForm,
    addApi: options.addApi,
    updateApi: options.updateApi,
    transformPayload: options.transformPayload,
    onDialogOpen: options.onDialogOpen,
  })
  const { dialogVisible, formData } = dialog
  /** 「新增子级」时挂的父节点（树形特有） */
  const parentRow = dialog.extraRow

  onScopeDispose(() => {
    loading.value = false
  })

  async function getTreeData() {
    if (request.isDisposed()) return
    const requestId = request.begin()
    const isLatestRequest = () => request.isCurrent(requestId)
    loading.value = true
    treeError.value = false
    try {
      const { data } = await options.treeApi({ ...searchData } as Q)
      if (isLatestRequest()) treeData.value = data ?? []
    } catch {
      if (isLatestRequest()) treeError.value = true
    } finally {
      if (isLatestRequest()) loading.value = false
    }
  }

  function handleSearch() {
    void getTreeData()
  }

  function resetSearch() {
    // 与 useCrud 保持一致：按 key 清空，不依赖 el-form 的 resetFields
    Object.keys(searchData as any).forEach((key) => {
      delete (searchData as any)[key]
    })
    Object.assign(searchData as any, options.defaultQuery?.() || {})
    void getTreeData()
  }

  function openDialog(form: Record<string, any>, parent: T | null = null) {
    if (request.isDisposed()) return
    dialog.openDialog(form, !form?.[idKey], { parent: parent ?? undefined }, parent)
  }

  function handleAdd() {
    openDialog(options.defaultForm?.() || {})
  }

  /**
   * 在指定节点下新增子级。
   * 初始值以 defaultForm 为底，再叠加 childForm 按父节点推导出的字段
   * （如菜单页：父级是目录则子级默认菜单、父级是菜单则默认按钮），
   * parentId 最后强制写入，避免被 childForm 覆盖成 undefined。
   */
  function handleAddChild(row: T) {
    openDialog(
      {
        ...(options.defaultForm?.() || {}),
        ...(options.childForm?.(row) ?? {}),
        parentId: rowId(row),
      },
      row,
    )
  }

  function handleEdit(row: T) {
    openDialog({ ...(row as Record<string, any>) }, null)
  }

  function handleClose() {
    dialog.closeDialog()
  }

  function handleSubmit(isAdd: boolean): Promise<ResponseVO<any> | void> {
    return dialog.submit(isAdd, {
      isDisposed: () => request.isDisposed(),
      onClosed: () => {
        parentRow.value = null
      },
      afterSuccess: getTreeData,
    })
  }

  async function handleRemove(row: T) {
    if (request.isDisposed() || !options.removeApi) return

    const blocked = options.removeGuard?.(row)
    if (blocked) {
      ElMessage.warning(blocked)
      return
    }

    const confirmText = options.removeConfirmText?.(row) ?? t('common.messages.deleteConfirm')

    if (!(await dialog.confirmRemove(confirmText))) return

    if (request.isDisposed()) return
    try {
      const res = await options.removeApi(rowId(row) as number | string)
      if (request.isDisposed()) return
      ElMessage.success(res.msg || t('common.messages.deleteSuccess'))
      await getTreeData()
    } catch {
      return
    }
  }

  const slotProps = reactive({
    searchData,
    handleSearch,
    resetSearch,
    get treeData() {
      return treeData.value
    },
    get loading() {
      return loading.value
    },
    get treeError() {
      return treeError.value
    },
    refresh: getTreeData,
    get formData() {
      return dialog.formData.value
    },
    get dialogVisible() {
      return dialog.dialogVisible.value
    },
    get sessionId() {
      return dialog.sessionId()
    },
    set dialogVisible(val: boolean) {
      dialog.dialogVisible.value = val
    },
    handleAdd,
    handleAddChild,
    handleEdit,
    handleRemove,
    handleClose,
    handleSubmit,
    get parentRow() {
      return parentRow.value
    },
  } as UseTreeCrudSlotProps<Q, T>)

  // 与 useCrud 保持同一套对外契约：slotProps / refresh / state
  return {
    slotProps,
    refresh: getTreeData,
    state: dialog.state,
  }
}
