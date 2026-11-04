import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTreeCrud } from '@/common/composables/useTreeCrud'
import type { UseTreeCrudOptions } from '@/common/composables/useTreeCrud'
import type { ResponseVO } from 'types/api'

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), warning: vi.fn() },
  ElMessageBox: { confirm: vi.fn() },
}))

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

interface Row {
  id: number
  name: string
}

type TreeResponse = ResponseVO<Row[]>
type Query = { name?: string }

const scopes: ReturnType<typeof effectScope>[] = []

function deferred<Value>() {
  let resolve!: (value: Value) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function treeResponse(id = 1): TreeResponse {
  return { code: 200, msg: 'ok', data: [{ id, name: `row-${id}` }] }
}

function setupModel(overrides: Partial<UseTreeCrudOptions<Query, Row>> = {}) {
  const treeApi = vi
    .fn<UseTreeCrudOptions<Query, Row>['treeApi']>()
    .mockResolvedValue(treeResponse())
  const addApi = vi.fn(async () => ({ code: 200, msg: 'saved' }))
  const updateApi = vi.fn(async () => ({ code: 200, msg: 'updated' }))
  const removeApi = vi.fn(async () => ({ code: 200, msg: 'removed' }))
  const scope = effectScope()
  scopes.push(scope)
  const model = scope.run(() =>
    useTreeCrud<Query, Row>({
      treeApi,
      addApi,
      updateApi,
      removeApi,
      defaultQuery: () => ({ name: '' }),
      defaultForm: () => ({ name: '' }),
      ...overrides,
    }),
  )!
  return { model, scope, treeApi, addApi, updateApi, removeApi }
}

function pendingRequests() {
  const older = deferred<TreeResponse>()
  const latest = deferred<TreeResponse>()
  const treeApi = vi
    .fn<UseTreeCrudOptions<Query, Row>['treeApi']>()
    .mockReturnValueOnce(older.promise)
    .mockReturnValueOnce(latest.promise)
  const { model, scope } = setupModel({ treeApi })
  const first = model.refresh()
  const second = model.refresh()
  return { model, scope, treeApi, older, latest, first, second }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm')
})

afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))

describe('useTreeCrud 查询可靠性', () => {
  it('刷新使用当前查询快照，正常结果与空结果都不是错误', async () => {
    const { model, treeApi } = setupModel()
    model.slotProps.searchData.name = '部门'
    const request = model.refresh()
    model.slotProps.searchData.name = '另一查询'
    await request
    expect(treeApi).toHaveBeenCalledWith({ name: '部门' })
    expect(model.slotProps.treeData).toEqual(treeResponse().data)
    expect(model.slotProps.treeError).toBe(false)
    treeApi.mockResolvedValueOnce({ code: 200, msg: 'ok', data: [] })
    await model.refresh()
    expect(model.slotProps.treeData).toEqual([])
    expect(model.slotProps.treeError).toBe(false)
  })

  it('最新请求失败保留数据并标记错误，重试立即清错后恢复', async () => {
    const { model, treeApi } = setupModel()
    await model.refresh()
    treeApi.mockRejectedValueOnce(new Error('offline'))
    await expect(model.refresh()).resolves.toBeUndefined()
    expect(model.slotProps.treeData).toEqual(treeResponse().data)
    expect(model.slotProps.treeError).toBe(true)
    expect(model.slotProps.loading).toBe(false)

    const retry = deferred<TreeResponse>()
    treeApi.mockReturnValueOnce(retry.promise)
    const request = model.slotProps.refresh()
    expect(model.slotProps.treeError).toBe(false)
    expect(model.slotProps.loading).toBe(true)
    retry.resolve(treeResponse(2))
    await request
    expect(model.slotProps.treeData).toEqual(treeResponse(2).data)
    expect(model.slotProps.loading).toBe(false)
  })

  it('旧成功响应不能覆盖先完成的新结果', async () => {
    const { model, older, latest, first, second } = pendingRequests()
    latest.resolve(treeResponse(2))
    await second
    older.resolve(treeResponse(1))
    await first
    expect(model.slotProps.treeData).toEqual(treeResponse(2).data)
    expect(model.slotProps.treeError).toBe(false)
  })

  it.each(['success', 'failure'])('旧请求完成不结束新请求的加载态：%s', async (outcome) => {
    const { model, older, latest, first, second } = pendingRequests()
    if (outcome === 'success') older.resolve(treeResponse(1))
    else older.reject(new Error('stale'))
    await first
    expect(model.slotProps.loading).toBe(true)
    expect(model.slotProps.treeError).toBe(false)
    expect(model.slotProps.treeData).toEqual([])
    latest.resolve(treeResponse(2))
    await second
    expect(model.slotProps.loading).toBe(false)
  })

  it('新请求失败后，旧成功响应不能消除错误或回填数据', async () => {
    const { model, older, latest, first, second } = pendingRequests()
    latest.reject(new Error('latest failure'))
    await second
    older.resolve(treeResponse())
    await first
    expect(model.slotProps.treeError).toBe(true)
    expect(model.slotProps.treeData).toEqual([])
    expect(model.slotProps.loading).toBe(false)
  })

  it('新请求成功后，旧失败不能清空数据或设置错误', async () => {
    const { model, older, latest, first, second } = pendingRequests()
    latest.resolve(treeResponse(2))
    await second
    older.reject(new Error('old failure'))
    await first
    expect(model.slotProps.treeData).toEqual(treeResponse(2).data)
    expect(model.slotProps.treeError).toBe(false)
  })

  it('搜索和重置自行接住请求失败，重置恢复初始查询', async () => {
    const { model, treeApi } = setupModel()
    treeApi.mockRejectedValue(new Error('offline'))
    model.slotProps.searchData.name = '搜索条件'
    model.slotProps.handleSearch()
    await flushPromises()
    expect(model.slotProps.treeError).toBe(true)
    model.slotProps.searchData.extra = '临时条件'
    model.slotProps.resetSearch()
    await flushPromises()
    expect(treeApi).toHaveBeenLastCalledWith({ name: '' })
    expect(model.slotProps.searchData).toEqual({ name: '' })
    expect(model.slotProps.loading).toBe(false)
  })

  it.each(['success', 'failure'])('卸载后旧响应不回写，也不允许新查询：%s', async (outcome) => {
    const pending = deferred<TreeResponse>()
    const { model, scope, treeApi } = setupModel()
    treeApi.mockReturnValueOnce(pending.promise)
    const request = model.refresh()
    scope.stop()
    const snapshot = {
      rows: model.slotProps.treeData,
      loading: model.slotProps.loading,
      error: model.slotProps.treeError,
    }
    if (outcome === 'success') pending.resolve(treeResponse())
    else pending.reject(new Error('disposed'))
    await request
    await model.refresh()
    model.slotProps.handleSearch()
    model.slotProps.resetSearch()
    expect(treeApi).toHaveBeenCalledTimes(1)
    expect({
      rows: model.slotProps.treeData,
      loading: model.slotProps.loading,
      error: model.slotProps.treeError,
    }).toEqual(snapshot)
  })
})

describe('useTreeCrud 写操作可靠性', () => {
  it('新增、子级新增和编辑仍保留原有表单与钩子契约', () => {
    const onDialogOpen = vi.fn()
    const { model } = setupModel({ onDialogOpen })
    model.slotProps.handleAdd()
    expect(model.slotProps.formData).toEqual({ name: '' })
    model.slotProps.handleAddChild({ id: 9, name: '父级' })
    expect(model.slotProps.formData).toEqual({ name: '', parentId: 9 })
    model.slotProps.handleEdit({ id: 3, name: '编辑' })
    expect(model.slotProps.formData).toEqual({ id: 3, name: '编辑' })
    expect(onDialogOpen).toHaveBeenCalledTimes(3)
  })

  it('提交失败不拒绝、不关闭弹窗，保留表单且可以重试', async () => {
    const { model, addApi, treeApi } = setupModel()
    model.slotProps.handleAdd()
    model.slotProps.formData.name = '待保存'
    addApi.mockRejectedValueOnce(new Error('save failed'))
    await expect(model.slotProps.handleSubmit(true)).resolves.toBeUndefined()
    expect(model.slotProps.dialogVisible).toBe(true)
    expect(model.slotProps.formData.name).toBe('待保存')
    expect(treeApi).not.toHaveBeenCalled()
    expect(ElMessage.success).not.toHaveBeenCalled()
    await model.slotProps.handleSubmit(true)
    expect(addApi).toHaveBeenCalledTimes(2)
    expect(model.slotProps.dialogVisible).toBe(false)
    expect(treeApi).toHaveBeenCalledTimes(1)
  })

  it('编辑使用修改接口和转换后的载荷，成功后刷新树', async () => {
    const transformPayload = vi.fn((form, isAdd) => ({ ...form, isAdd }))
    const { model, addApi, updateApi, treeApi } = setupModel({ transformPayload })
    model.slotProps.handleEdit({ id: 7, name: '修改' })
    await model.slotProps.handleSubmit(false)
    expect(updateApi).toHaveBeenCalledWith({ id: 7, name: '修改', isAdd: false })
    expect(addApi).not.toHaveBeenCalled()
    expect(treeApi).toHaveBeenCalledTimes(1)
  })

  it('载荷转换抛错同样恢复提交锁并保留表单', async () => {
    const transformPayload = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('invalid payload')
      })
      .mockImplementation((form) => ({ ...form }))
    const { model, addApi } = setupModel({ transformPayload })
    model.slotProps.handleAdd()
    await expect(model.slotProps.handleSubmit(true)).resolves.toBeUndefined()
    expect(addApi).not.toHaveBeenCalled()
    await model.slotProps.handleSubmit(true)
    expect(addApi).toHaveBeenCalledTimes(1)
  })

  it('重复提交只调用一次写接口，成功后查询失败显示树错误', async () => {
    const pending = deferred<ResponseVO<unknown>>()
    const addApi = vi.fn().mockReturnValueOnce(pending.promise)
    const { model, treeApi } = setupModel({ addApi })
    model.slotProps.handleAdd()
    const request = model.slotProps.handleSubmit(true)
    await model.slotProps.handleSubmit(true)
    expect(addApi).toHaveBeenCalledTimes(1)
    treeApi.mockRejectedValueOnce(new Error('reload failed'))
    pending.resolve({ code: 200, msg: 'saved' })
    await request
    expect(model.slotProps.dialogVisible).toBe(false)
    expect(model.slotProps.treeError).toBe(true)
    expect(ElMessage.success).toHaveBeenCalledTimes(1)
  })

  it('旧弹窗保存成功不关闭重新打开的编辑表单', async () => {
    const pending = deferred<ResponseVO<unknown>>()
    const addApi = vi.fn().mockReturnValueOnce(pending.promise)
    const { model, treeApi } = setupModel({ addApi })
    model.slotProps.handleAdd()
    const request = model.slotProps.handleSubmit(true)
    model.slotProps.handleClose()
    model.slotProps.handleEdit({ id: 5, name: '新弹窗' })
    pending.resolve({ code: 200, msg: 'saved' })
    await request
    expect(model.slotProps.dialogVisible).toBe(true)
    expect(model.slotProps.formData).toEqual({ id: 5, name: '新弹窗' })
    expect(treeApi).toHaveBeenCalledTimes(1)
  })

  it('删除失败自行接住异常，不触发成功或刷新', async () => {
    const { model, removeApi, treeApi } = setupModel()
    removeApi.mockRejectedValueOnce(new Error('delete failed'))
    await expect(model.slotProps.handleRemove({ id: 1 })).resolves.toBeUndefined()
    expect(treeApi).not.toHaveBeenCalled()
    expect(ElMessage.success).not.toHaveBeenCalled()
    await model.slotProps.handleRemove({ id: 1 })
    expect(removeApi).toHaveBeenCalledTimes(2)
    expect(treeApi).toHaveBeenCalledTimes(1)
  })

  it('删除前置校验与取消确认都不调用删除接口', async () => {
    const guarded = setupModel({ removeGuard: () => '有子节点' })
    await guarded.model.slotProps.handleRemove({ id: 1 })
    expect(ElMessage.warning).toHaveBeenCalledWith('有子节点')
    expect(guarded.removeApi).not.toHaveBeenCalled()
    const cancelled = setupModel()
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce('cancel')
    await cancelled.model.slotProps.handleRemove({ id: 1 })
    expect(cancelled.removeApi).not.toHaveBeenCalled()
  })

  it('卸载后保存成功不提示、不刷新、不关闭保留的弹窗状态', async () => {
    const pending = deferred<ResponseVO<unknown>>()
    const addApi = vi.fn().mockReturnValueOnce(pending.promise)
    const { model, scope, treeApi } = setupModel({ addApi })
    model.slotProps.handleAdd()
    const request = model.slotProps.handleSubmit(true)
    scope.stop()
    pending.resolve({ code: 200, msg: 'saved' })
    await request
    expect(model.slotProps.dialogVisible).toBe(true)
    expect(ElMessage.success).not.toHaveBeenCalled()
    expect(treeApi).not.toHaveBeenCalled()
    await model.slotProps.handleSubmit(true)
    expect(addApi).toHaveBeenCalledTimes(1)
  })

  it('确认删除期间卸载不再执行删除接口', async () => {
    const confirm = deferred<Awaited<ReturnType<typeof ElMessageBox.confirm>>>()
    vi.mocked(ElMessageBox.confirm).mockReturnValueOnce(confirm.promise)
    const { model, scope, removeApi } = setupModel()
    const request = model.slotProps.handleRemove({ id: 1 })
    scope.stop()
    confirm.resolve('confirm')
    await request
    expect(removeApi).not.toHaveBeenCalled()
  })
})
