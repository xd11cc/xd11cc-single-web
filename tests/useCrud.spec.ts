import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import type { ResponseVO } from 'types/api'

/**
 * useCrud 的接口测试。
 *
 * 只通过对外三条路径验证行为：slotProps / refresh / state。
 * 所有依赖由用例注入，不 mock HTTP。
 */

// ElMessageBox.confirm 由用例控制：默认「确认」，需要「取消」时改实现
const confirmMock = vi.fn(() => Promise.resolve())
const removeSpy = vi.fn()

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return {
    ...actual,
    ElMessage: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
    ElMessageBox: { confirm: (...args: unknown[]) => confirmMock(...args) },
  }
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
}))

import { useCrud } from '@/common/composables/useCrud'

interface Row {
  id: number
  name: string
}

type PageResponse = ResponseVO<{ rows: Row[]; total: number }>

function deferred<Value>() {
  let resolve!: (value: Value) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function makePageResponse(id: number, total: number): PageResponse {
  return { code: 200, msg: 'ok', data: { rows: [{ id, name: `row-${id}` }], total } }
}

function withPendingRequests() {
  const older = deferred<PageResponse>()
  const latest = deferred<PageResponse>()
  const pageApi = vi
    .fn<(query: Record<string, unknown>) => Promise<PageResponse>>()
    .mockReturnValueOnce(older.promise)
    .mockReturnValueOnce(latest.promise)
  const { result: crud, wrapper } = withSetup(() => useCrud({ pageApi }))
  const latestRefresh = crud.refresh()
  return { older, latest, pageApi, crud, wrapper, latestRefresh }
}

function makePageApi(
  rows: Row[] = [
    { id: 1, name: 'a' },
    { id: 2, name: 'b' },
  ],
) {
  return vi.fn(async (query: Record<string, any>) => ({
    code: 200,
    msg: 'ok',
    data: { rows, total: rows.length, query },
  })) as unknown as (
    query: Record<string, any>,
  ) => Promise<ResponseVO<{ rows: Row[]; total: number }>>
}

/**
 * 在组件上下文里创建 useCrud：onMounted / watch 都需要 active instance，
 * 裸调用会报 “onMounted is called when there is no active component instance”。
 */
function withSetup<T>(fn: () => T) {
  let result!: T
  const wrapper = mount(
    defineComponent({
      setup() {
        result = fn()
        return () => null
      },
    }),
  )
  return { result, wrapper }
}

describe('useCrud 对外契约', () => {
  it('refresh 拉取数据并写入 tableData / total', async () => {
    const pageApi = makePageApi()
    const { result: crud, wrapper } = withSetup(() => useCrud({ pageApi }))

    await vi.waitFor(() => expect(pageApi).toHaveBeenCalled())
    pageApi.mockClear()

    await crud.refresh()

    expect(pageApi).toHaveBeenCalledTimes(1)
    expect(crud.slotProps.tableData).toHaveLength(2)
    expect(crud.slotProps.paginationData.total).toBe(2)
    wrapper.unmount()
  })

  it('handleSearch 会把页码重置到第 1 页', async () => {
    const pageApi = makePageApi()
    const { result: crud, wrapper } = withSetup(() => useCrud({ pageApi }))
    await vi.waitFor(() => expect(pageApi).toHaveBeenCalled())

    // 先离开第 1 页，并等 watch 观察到这次变化
    crud.slotProps.paginationData.currentPage = 3
    await nextTick()
    pageApi.mockClear()

    crud.slotProps.handleSearch()
    await vi.waitFor(() => expect(pageApi).toHaveBeenCalled())

    expect(crud.slotProps.paginationData.currentPage).toBe(1)
    expect(pageApi.mock.calls.at(-1)?.[0]).toMatchObject({ currentPage: 1 })
    wrapper.unmount()
  })

  it('resetSearch 清空条件并恢复 defaultQuery', async () => {
    const pageApi = makePageApi()
    const { result: crud, wrapper } = withSetup(() =>
      useCrud({ pageApi, defaultQuery: () => ({ status: '0' }) }),
    )

    crud.slotProps.searchData.name = 'abc'
    crud.slotProps.searchData.status = '1'
    crud.slotProps.resetSearch()

    expect(crud.slotProps.searchData.name).toBeUndefined()
    expect(crud.slotProps.searchData.status).toBe('0')
    wrapper.unmount()
  })

  it('删除成功后调用 removeApi 并刷新列表', async () => {
    const pageApi = makePageApi()
    const { result: crud, wrapper } = withSetup(() => useCrud({ pageApi, removeApi: removeSpy }))
    await vi.waitFor(() => expect(pageApi).toHaveBeenCalled())
    removeSpy.mockResolvedValue({ code: 200, msg: 'ok', data: null })
    pageApi.mockClear()

    await crud.slotProps.handleRemove({ id: 7 })
    await vi.waitFor(() => expect(pageApi).toHaveBeenCalled())

    expect(confirmMock).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledWith('7')
    wrapper.unmount()
  })

  it('删除弹窗被取消时不应调用 removeApi', async () => {
    // 给拒绝的 promise 挂一个空 catch：既保留「取消」语义，又不产生 unhandled rejection
    confirmMock.mockImplementation(() => {
      const rejected = Promise.reject(new Error('cancel'))
      rejected.catch(() => {})
      return rejected
    })
    const pageApi = makePageApi()
    const { result: crud, wrapper } = withSetup(() => useCrud({ pageApi, removeApi: removeSpy }))
    await nextTick()

    await crud.slotProps.handleRemove({ id: 7 })
    await nextTick()

    expect(removeSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('在第 2 页改每页条数只发一次请求', async () => {
    const pageApi = makePageApi()
    const { result: crud, wrapper } = withSetup(() => useCrud({ pageApi }))
    await vi.waitFor(() => expect(pageApi).toHaveBeenCalled())

    // 先翻到第 2 页并等请求完成
    crud.slotProps.paginationData.currentPage = 2
    await vi.waitFor(() => expect(pageApi.mock.calls.at(-1)?.[0]).toMatchObject({ currentPage: 2 }))
    pageApi.mockClear()

    // 改每页条数：页码会被重置到 1，应只发一次请求
    crud.slotProps.handleSizeChange(20)
    await vi.waitFor(() => expect(pageApi).toHaveBeenCalled())

    expect(pageApi).toHaveBeenCalledTimes(1)
    expect(pageApi.mock.calls.at(-1)?.[0]).toMatchObject({ currentPage: 1, pageSize: 20 })
    wrapper.unmount()
  })

  it('列表请求失败时状态复位、不抛错，并标记错误态', async () => {
    const pageApi = makePageApi()
    pageApi.mockRejectedValue(new Error('boom'))
    const { result: crud, wrapper } = withSetup(() => useCrud({ pageApi }))

    await vi.waitFor(() => expect(crud.slotProps.tableLoading).toBe(false))
    // 失败不能让调用方拿到未处理的 rejection
    await expect(crud.refresh()).resolves.toBeUndefined()
    expect(crud.slotProps.tableLoading).toBe(false)
    expect(crud.slotProps.tableError).toBe(true)
    wrapper.unmount()
  })

  it('旧请求晚返回时不能覆盖最新数据与总数', async () => {
    const { older, latest, crud, wrapper, latestRefresh } = withPendingRequests()

    latest.resolve(makePageResponse(2, 20))
    await latestRefresh
    older.resolve(makePageResponse(1, 10))
    await flushPromises()

    expect(crud.slotProps.tableData).toEqual([{ id: 2, name: 'row-2' }])
    expect(crud.slotProps.paginationData.total).toBe(20)
    expect(crud.slotProps.tableError).toBe(false)
    expect(crud.slotProps.tableLoading).toBe(false)
    wrapper.unmount()
  })

  it('旧请求晚失败时不能覆盖最新成功状态', async () => {
    const { older, latest, crud, wrapper, latestRefresh } = withPendingRequests()

    latest.resolve(makePageResponse(2, 20))
    await latestRefresh
    older.reject(new Error('older request failed'))
    await flushPromises()

    expect(crud.slotProps.tableData).toEqual([{ id: 2, name: 'row-2' }])
    expect(crud.slotProps.paginationData.total).toBe(20)
    expect(crud.slotProps.tableError).toBe(false)
    expect(crud.slotProps.tableLoading).toBe(false)
    wrapper.unmount()
  })

  it.each(['success', 'failure'] as const)(
    '最新请求在途时，旧请求 %s 不能修改列表状态或关闭 loading',
    async (outcome) => {
      const { older, latest, crud, wrapper, latestRefresh } = withPendingRequests()

      if (outcome === 'success') {
        older.resolve(makePageResponse(1, 10))
      } else {
        older.reject(new Error('older request failed'))
      }
      await flushPromises()

      expect(crud.slotProps.tableData).toEqual([])
      expect(crud.slotProps.paginationData.total).toBe(0)
      expect(crud.slotProps.tableError).toBe(false)
      expect(crud.slotProps.tableLoading).toBe(true)

      latest.resolve(makePageResponse(2, 20))
      await latestRefresh
      expect(crud.slotProps.tableLoading).toBe(false)
      wrapper.unmount()
    },
  )

  it('最新请求失败后，旧请求成功不能回填数据', async () => {
    const { older, latest, crud, wrapper, latestRefresh } = withPendingRequests()

    latest.reject(new Error('latest request failed'))
    await expect(latestRefresh).resolves.toBeUndefined()
    older.resolve(makePageResponse(1, 10))
    await flushPromises()

    expect(crud.slotProps.tableData).toEqual([])
    expect(crud.slotProps.paginationData.total).toBe(0)
    expect(crud.slotProps.tableError).toBe(true)
    expect(crud.slotProps.tableLoading).toBe(false)
    wrapper.unmount()
  })

  it.each(['success', 'failure'] as const)(
    '组件销毁后，请求 %s 不再更新状态，也不能发起新请求',
    async (outcome) => {
      const { older, latest, pageApi, crud, wrapper, latestRefresh } = withPendingRequests()
      wrapper.unmount()

      await expect(crud.refresh()).resolves.toBeUndefined()
      expect(pageApi).toHaveBeenCalledTimes(2)

      older.resolve(makePageResponse(1, 10))
      if (outcome === 'success') {
        latest.resolve(makePageResponse(2, 20))
      } else {
        latest.reject(new Error('request failed after disposal'))
      }
      await expect(latestRefresh).resolves.toBeUndefined()
      await flushPromises()

      expect(crud.slotProps.tableData).toEqual([])
      expect(crud.slotProps.paginationData.total).toBe(0)
      expect(crud.slotProps.tableError).toBe(false)
      expect(crud.slotProps.tableLoading).toBe(true)
    },
  )

  it('不同 CRUD 实例的请求序号互不影响', async () => {
    const firstRequest = deferred<PageResponse>()
    const secondRequest = deferred<PageResponse>()
    const first = withSetup(() => useCrud({ pageApi: () => firstRequest.promise }))
    const second = withSetup(() => useCrud({ pageApi: () => secondRequest.promise }))

    firstRequest.resolve(makePageResponse(1, 10))
    await flushPromises()
    expect(first.result.slotProps.tableData).toEqual([{ id: 1, name: 'row-1' }])
    expect(first.result.slotProps.tableLoading).toBe(false)
    expect(second.result.slotProps.tableLoading).toBe(true)

    secondRequest.resolve(makePageResponse(2, 20))
    await flushPromises()
    expect(second.result.slotProps.tableData).toEqual([{ id: 2, name: 'row-2' }])
    expect(second.result.slotProps.tableLoading).toBe(false)
    first.wrapper.unmount()
    second.wrapper.unmount()
  })

  it('onDialogOpen 能区分新增与编辑', async () => {
    const onDialogOpen = vi.fn()
    const { result: crud, wrapper } = withSetup(() =>
      useCrud({ pageApi: makePageApi(), onDialogOpen }),
    )

    crud.slotProps.handleAdd()
    expect(onDialogOpen).toHaveBeenLastCalledWith(expect.objectContaining({ isAdd: true }))

    crud.slotProps.handleEdit({ id: 9, name: 'x' })
    expect(onDialogOpen).toHaveBeenLastCalledWith(
      expect.objectContaining({ isAdd: false, row: expect.objectContaining({ id: 9 }) }),
    )
    wrapper.unmount()
  })
})
