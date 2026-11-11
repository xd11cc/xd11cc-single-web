import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

/**
 * 共享弹窗逻辑（`useCrudDialog`）的契约。
 *
 * 这一层顶替了原先在两个壳里各写一份的「弹窗状态 + 会话号 + 提交守卫 + 删除确认」，
 * 所以它的行为必须被单独盯住——它一旦退化，两个壳会同时出错。
 */

const confirmMock = vi.fn()
vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return {
    ...actual,
    ElMessage: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
    ElMessageBox: { confirm: (...args: unknown[]) => confirmMock(...args) },
  }
})
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

import { useCrudDialog } from '@/common/composables/useCrudDialog'

function deferred<Value>() {
  let resolve!: (value: Value) => void
  const promise = new Promise<Value>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function withSetup(fn: () => void) {
  return mount(
    defineComponent({
      setup() {
        fn()
        return () => null
      },
    }),
  )
}

describe('useCrudDialog', () => {
  it('打开/关闭都会推进会话号，旧会话立即失效', async () => {
    let dialog!: ReturnType<typeof useCrudDialog>
    const wrapper = withSetup(() => {
      dialog = useCrudDialog({ defaultForm: () => ({ name: '' }) })
    })
    await flushPromises()

    const first = dialog.sessionId()
    dialog.openDialog({ name: 'A' }, true)
    await nextTick()
    expect(dialog.isCurrentSession(first)).toBe(false)
    expect(dialog.dialogVisible.value).toBe(true)

    const second = dialog.sessionId()
    dialog.closeDialog()
    expect(dialog.isCurrentSession(second)).toBe(false)
    expect(dialog.dialogVisible.value).toBe(false)
    wrapper.unmount()
  })

  it('会话未变时提交成功会关窗，并执行刷新', async () => {
    const refresh = vi.fn()
    const addApi = vi.fn(async () => ({ code: 200, msg: 'ok', data: 1 }))
    let dialog!: ReturnType<typeof useCrudDialog>
    const wrapper = withSetup(() => {
      dialog = useCrudDialog({ addApi })
    })
    await flushPromises()

    dialog.openDialog({ name: 'A' }, true)
    await dialog.submit(true, { afterSuccess: refresh })

    expect(addApi).toHaveBeenCalledTimes(1)
    expect(dialog.dialogVisible.value).toBe(false)
    expect(refresh).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('提交期间切了弹窗会话，就不要再关窗（否则会关掉新弹窗）', async () => {
    const pending = deferred<{ code: number; msg: string; data: number }>()
    const addApi = vi.fn(() => pending.promise)
    let dialog!: ReturnType<typeof useCrudDialog>
    const wrapper = withSetup(() => {
      dialog = useCrudDialog({ addApi })
    })
    await flushPromises()

    dialog.openDialog({ name: 'A' }, true)
    const submitting = dialog.submit(true)

    // 用户关掉又打开了另一个
    dialog.closeDialog()
    dialog.openDialog({ name: 'B' }, false)
    expect(dialog.dialogVisible.value).toBe(true)

    pending.resolve({ code: 200, msg: 'ok', data: 1 })
    await submitting

    expect(dialog.dialogVisible.value, '旧提交把新弹窗关掉了').toBe(true)
    wrapper.unmount()
  })

  it('确认框返回取消时 confirmRemove 为 false，确认时为 true', async () => {
    let dialog!: ReturnType<typeof useCrudDialog>
    const wrapper = withSetup(() => {
      dialog = useCrudDialog({})
    })
    await flushPromises()

    confirmMock.mockRejectedValueOnce(new Error('cancel'))
    await expect(dialog.confirmRemove('删？')).resolves.toBe(false)

    confirmMock.mockResolvedValueOnce('confirm')
    await expect(dialog.confirmRemove('删？')).resolves.toBe(true)
    wrapper.unmount()
  })

  it('旧会话的提交在途时，新会话仍可提交（按会话串行）', async () => {
    const first = deferred<{ code: number; msg: string; data: number }>()
    const second = deferred<{ code: number; msg: string; data: number }>()
    const addApi = vi
      .fn<() => Promise<{ code: number; msg: string; data: number }>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    let dialog!: ReturnType<typeof useCrudDialog>
    const wrapper = withSetup(() => {
      dialog = useCrudDialog({ addApi })
    })
    await flushPromises()

    dialog.openDialog({ name: 'A' }, true)
    const submittingA = dialog.submit(true)

    // 会话 A 还没回来，用户关掉并打开 B
    dialog.closeDialog()
    dialog.openDialog({ name: 'B' }, true)
    const submittingB = dialog.submit(true)

    expect(addApi, '新会话被上一个会话的锁挡住了').toHaveBeenCalledTimes(2)

    first.resolve({ code: 200, msg: 'ok', data: 1 })
    second.resolve({ code: 200, msg: 'ok', data: 2 })
    await Promise.all([submittingA, submittingB])
    wrapper.unmount()
  })

  it('同一会话内提交进行中不会重复发起', async () => {
    const pending = deferred<{ code: number; msg: string; data: number }>()
    const addApi = vi.fn(() => pending.promise)
    let dialog!: ReturnType<typeof useCrudDialog>
    const wrapper = withSetup(() => {
      dialog = useCrudDialog({ addApi })
    })
    await flushPromises()

    dialog.openDialog({ name: 'A' }, true)
    const first = dialog.submit(true)
    await dialog.submit(true)

    expect(addApi).toHaveBeenCalledTimes(1)
    pending.resolve({ code: 200, msg: 'ok', data: 1 })
    await first
    wrapper.unmount()
  })
})
