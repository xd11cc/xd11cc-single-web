import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
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

function makePageApi(rows: Row[] = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }]) {
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
    const { result: crud, wrapper } = withSetup(() =>
      useCrud({ pageApi, removeApi: removeSpy }),
    )
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
    const { result: crud, wrapper } = withSetup(() =>
      useCrud({ pageApi, removeApi: removeSpy }),
    )
    await nextTick()

    await crud.slotProps.handleRemove({ id: 7 })
    await nextTick()

    expect(removeSpy).not.toHaveBeenCalled()
    wrapper.unmount()
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
