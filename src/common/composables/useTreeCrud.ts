import type { ResponseVO } from 'types/api'
import { onScopeDispose, reactive, ref } from 'vue'
import { useLatestRequest } from './useLatestRequest'
import { ElMessage, ElMessageBox } from 'element-plus'
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
  extends BaseCrudOptions<{ isAdd: boolean; form: Record<string, any>; parent?: any }> {
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
  const submitLoading = ref(false)

  const searchData = reactive(options.defaultQuery?.() || {}) as Q

  const dialogVisible = ref(false)
  const formData = ref<any>(options.defaultForm?.() || {})
  const parentRow = ref<T | null>(null)
  const request = useLatestRequest()
  let dialogSessionId = 0

  onScopeDispose(() => {
    dialogSessionId++
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
    dialogSessionId++
    formData.value = form
    parentRow.value = parent
    dialogVisible.value = true
    options.onDialogOpen?.({ isAdd: !form?.[idKey], form, parent: parent ?? undefined })
  }

  function handleAdd() {
    openDialog(options.defaultForm?.() || {})
  }

  /** 在指定节点下新增子级：预填 parentId（或父节点主键） */
  function handleAddChild(row: T) {
    openDialog({ ...(options.defaultForm?.() || {}), parentId: rowId(row) }, row)
  }

  function handleEdit(row: T) {
    openDialog({ ...(row as Record<string, any>) }, null)
  }

  function handleClose() {
    dialogSessionId++
    formData.value = options.defaultForm?.() || {}
    parentRow.value = null
    dialogVisible.value = false
  }

  async function handleSubmit(isAdd: boolean): Promise<ResponseVO<any> | void> {
    if (request.isDisposed() || submitLoading.value) return
    const api = isAdd ? options.addApi : options.updateApi
    if (!api) return

    const sessionId = dialogSessionId
    submitLoading.value = true
    try {
      const payload = options.transformPayload?.(formData.value, isAdd) ?? { ...formData.value }
      const res = await api(payload)
      if (request.isDisposed()) return res
      ElMessage.success(res.msg || t('common.messages.operationSuccess'))
      if (sessionId === dialogSessionId) {
        dialogVisible.value = false
        parentRow.value = null
      }
      await getTreeData()
      return res
    } catch {
      return
    } finally {
      if (!request.isDisposed()) submitLoading.value = false
    }
  }

  async function handleRemove(row: T) {
    if (request.isDisposed() || !options.removeApi) return

    const blocked = options.removeGuard?.(row)
    if (blocked) {
      ElMessage.warning(blocked)
      return
    }

    const confirmText = options.removeConfirmText?.(row) ?? t('common.messages.deleteConfirm')

    try {
      await ElMessageBox.confirm(confirmText, t('common.messages.confirmTitle'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      })
    } catch {
      // 用户取消
      return
    }

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
      return formData.value
    },
    get dialogVisible() {
      return dialogVisible.value
    },
    set dialogVisible(val: boolean) {
      dialogVisible.value = val
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
    state: { formData, dialogVisible },
  }
}
