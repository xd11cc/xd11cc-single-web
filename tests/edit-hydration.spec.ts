import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { useEditHydration } from '@/common/composables/useEditHydration'

/**
 * 编辑弹窗「关联数据回填闸门」的契约。
 *
 * 这套不变量原先在角色/岗位/通知三页各写一遍，且每处都出过「部分成功就放开保存」
 * 的问题。这里把语义钉死：**全部步骤成功才算就绪**，一旦失败就保持阻塞并可重试。
 */

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function withGate() {
  const state = { session: 1, visible: true }
  let gate!: ReturnType<typeof useEditHydration>
  const wrapper = mount(
    defineComponent({
      setup() {
        gate = useEditHydration({
          isCurrentSession: (session) => session === state.session,
          isVisible: () => state.visible,
        })
        return () => null
      },
    }),
  )
  return { gate, state, wrapper }
}

describe('useEditHydration', () => {
  it('全部步骤成功才算就绪', async () => {
    const { gate, wrapper } = withGate()
    const slow = deferred<void>()
    gate.register('menu', async () => {
      await slow.promise
    })
    gate.register('dept', async () => {})

    gate.start(1)
    await flushPromises()

    // 只有一个步骤完成时不允许保存
    expect(gate.ready.value).toBe(false)

    slow.resolve()
    await flushPromises()
    expect(gate.ready.value).toBe(true)
    wrapper.unmount()
  })

  it('任一步骤失败 → error，且 ready 保持 false', async () => {
    const { gate, wrapper } = withGate()
    gate.register('menu', async () => {})
    gate.register('dept', async () => false)

    gate.start(1)
    await flushPromises()

    expect(gate.ready.value).toBe(false)
    expect(gate.error.value).toBe(true)
    wrapper.unmount()
  })

  it('步骤抛错按失败处理，不会把异常抛到调用方', async () => {
    const { gate, wrapper } = withGate()
    gate.register('detail', async () => {
      throw new Error('boom')
    })
    gate.start(1)
    await flushPromises()

    expect(gate.error.value).toBe(true)
    expect(gate.ready.value).toBe(false)
    wrapper.unmount()
  })

  it('会话切换后，旧步骤的迟到结果不写回状态', async () => {
    const { gate, state, wrapper } = withGate()
    const oldRun = deferred<void>()
    let run = 0
    gate.register('menu', async () => {
      run++
      if (run === 1) await oldRun.promise
    })

    gate.start(1)
    await flushPromises()
    expect(gate.statusOf('menu')).toBe('running')

    // 换到新会话
    state.session = 2
    gate.start(2)
    await flushPromises()
    expect(gate.ready.value).toBe(true)

    // 旧会话的请求现在才回来
    oldRun.resolve()
    await flushPromises()
    expect(gate.ready.value, '旧会话的结果把新会话标记成了失败').toBe(true)
    expect(gate.statusOf('menu')).toBe('ok')
    wrapper.unmount()
  })

  it('restart 只重跑指定步骤，期间 ready 回落', async () => {
    const { gate, wrapper } = withGate()
    const menu = vi.fn(async () => {})
    const dept = vi.fn(async () => {})
    gate.register('menu', menu)
    gate.register('dept', dept)

    gate.start(1)
    await flushPromises()
    expect(gate.ready.value).toBe(true)

    const pending = deferred<void>()
    dept.mockImplementationOnce(async () => {
      await pending.promise
    })
    gate.restart('dept')
    await nextTick()

    expect(menu).toHaveBeenCalledTimes(1)
    expect(gate.ready.value, '重跑期间不应允许保存').toBe(false)

    pending.resolve()
    await flushPromises()
    expect(gate.ready.value).toBe(true)
    wrapper.unmount()
  })

  it('弹窗关闭后，在途步骤不会把状态写成成功', async () => {
    const { gate, state, wrapper } = withGate()
    const pending = deferred<void>()
    gate.register('detail', async () => {
      await pending.promise
    })

    gate.start(1)
    await flushPromises()

    state.visible = false
    pending.resolve()
    await flushPromises()

    expect(gate.statusOf('detail'), '关闭弹窗后仍把回填写成了完成').toBe('running')
    wrapper.unmount()
  })

  it('retry 会先重置数据源再重跑，失败后可恢复', async () => {
    const { gate, wrapper } = withGate()
    const resetSources = vi.fn()
    let attempt = 0
    const state = { session: 1, visible: true }
    let gate2!: ReturnType<typeof useEditHydration>
    const wrapper2 = mount(
      defineComponent({
        setup() {
          gate2 = useEditHydration({
            isCurrentSession: (session) => session === state.session,
            isVisible: () => state.visible,
            resetSources,
          })
          return () => null
        },
      }),
    )
    gate2.register('menu', async () => {
      attempt++
      return attempt > 1
    })

    gate2.start(1)
    await flushPromises()
    expect(gate2.error.value).toBe(true)

    gate2.retry()
    await flushPromises()
    expect(resetSources).toHaveBeenCalledTimes(1)
    expect(gate2.error.value).toBe(false)
    expect(gate2.ready.value).toBe(true)

    wrapper.unmount()
    wrapper2.unmount()
    void gate
  })

  it('retry 会重跑 runOnStart=false 且失败的步骤（而不是把它当成功跳过）', async () => {
    const { gate } = withGate()
    const detail = vi.fn(async () => true)
    let optionsAttempt = 0
    const options = vi.fn(async () => {
      optionsAttempt++
      return optionsAttempt > 1
    })
    gate.register('detail', detail)
    gate.register('options', options, { runOnStart: false })

    gate.start(1)
    await flushPromises()
    // 打开时 options 不跑，视为已满足
    expect(options).not.toHaveBeenCalled()
    expect(gate.ready.value).toBe(true)

    // 用户切换范围 → 失败
    gate.restart('options')
    await flushPromises()
    expect(gate.statusOf('options')).toBe('failed')
    expect(gate.error.value).toBe(true)

    gate.retry()
    await flushPromises()

    expect(options, 'retry 没有重跑失败的 options 步骤').toHaveBeenCalledTimes(2)
    expect(gate.statusOf('options')).toBe('ok')
    expect(gate.ready.value).toBe(true)
    expect(gate.error.value).toBe(false)
  })

  it('从未执行过的步骤标 skipped：不阻塞就绪，但 retry 会补跑它', async () => {
    const { gate } = withGate()
    const order: string[] = []
    const detail = vi.fn(async () => {
      order.push('detail')
      return false
    })
    const options = vi.fn(async () => {
      order.push('options')
    })
    gate.register('detail', detail)
    gate.register('options', options, { runOnStart: false })

    gate.start(1)
    await flushPromises()

    // 打开时不执行，也不阻塞——但状态是 skipped，不是 ok
    expect(options).not.toHaveBeenCalled()
    expect(gate.statusOf('options')).toBe('skipped')

    detail.mockImplementation(async () => {
      order.push('detail-retry')
    })
    gate.retry()
    await flushPromises()

    expect(options, 'retry 跳过了从未执行的步骤').toHaveBeenCalledTimes(1)
    expect(gate.statusOf('options')).toBe('ok')
    // 依赖顺序：先补详情，再补由它派生的选项
    expect(order).toEqual(['detail', 'detail-retry', 'options'])
    expect(gate.ready.value).toBe(true)
  })

  it('retry 按登记顺序串行补跑未成功的步骤，前一步失败就停', async () => {
    const { gate } = withGate()
    const run: string[] = []
    const first = vi.fn(async () => {
      run.push('first')
      return false
    })
    const second = vi.fn(async () => {
      run.push('second')
    })
    gate.register('first', first)
    gate.register('second', second, { runOnStart: false })

    gate.start(1)
    await flushPromises()

    gate.retry()
    await flushPromises()

    // first 再次失败 → 不再补跑 second，保持阻塞
    expect(run).toEqual(['first', 'first'])
    expect(second).not.toHaveBeenCalled()
    expect(gate.ready.value).toBe(false)
    expect(gate.error.value).toBe(true)
  })

  it('retry 不重跑已成功的步骤（避免覆盖用户已编辑的内容）', async () => {
    const { gate } = withGate()
    let menuAttempt = 0
    const menu = vi.fn(async () => {
      menuAttempt++
      return menuAttempt > 1
    })
    const detail = vi.fn(async () => true)
    gate.register('detail', detail)
    gate.register('menu', menu)

    gate.start(1)
    await flushPromises()
    expect(gate.statusOf('detail')).toBe('ok')
    expect(gate.statusOf('menu')).toBe('failed')

    gate.retry()
    await flushPromises()

    expect(detail, '已成功的详情步骤被重跑了，用户编辑会被覆盖').toHaveBeenCalledTimes(1)
    expect(menu).toHaveBeenCalledTimes(2)
    expect(gate.ready.value).toBe(true)
  })

  it('全部成功时 retry 是空操作（不重置数据源）', async () => {
    const state = { session: 1, visible: true }
    const resetSources = vi.fn()
    let gate!: ReturnType<typeof useEditHydration>
    const wrapper = mount(
      defineComponent({
        setup() {
          gate = useEditHydration({
            isCurrentSession: (session) => session === state.session,
            isVisible: () => state.visible,
            resetSources,
          })
          return () => null
        },
      }),
    )
    const menu = vi.fn(async () => {})
    gate.register('menu', menu)

    gate.start(1)
    await flushPromises()
    expect(gate.ready.value).toBe(true)

    gate.retry()
    await flushPromises()

    expect(resetSources).not.toHaveBeenCalled()
    expect(menu).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('重试途中切换记录：旧重试必须终止，新会话不能被卡在 running', async () => {
    const state = { session: 1, visible: true }
    let gate!: ReturnType<typeof useEditHydration>
    const wrapper = mount(
      defineComponent({
        setup() {
          gate = useEditHydration({
            isCurrentSession: (session) => session === state.session,
            isVisible: () => state.visible,
          })
          return () => null
        },
      }),
    )

    // 会话 1 的菜单请求挂起在途，直到测试手动放行
    let releaseMenu!: (value: boolean) => void
    gate.register('menu', async ({ session }) => {
      if (session === 1) {
        return await new Promise<boolean>((resolve) => {
          releaseMenu = resolve
        })
      }
      return true
    })
    gate.register('dept', async ({ session }) => session !== 1)

    gate.start(1)
    await flushPromises()
    expect(gate.statusOf('menu')).toBe('running')
    expect(gate.statusOf('dept')).toBe('failed')

    // 用户点「重试」，随后在重试进行中切换到另一条记录
    gate.retry()
    await flushPromises()
    state.session = 2
    gate.start(2)
    await flushPromises()
    expect(gate.ready.value, '新会话自身应当已就绪').toBe(true)

    // 旧会话的请求这时才回来
    releaseMenu(true)
    await flushPromises()

    expect(gate.statusOf('dept'), '旧重试把新会话的步骤卡在 running').not.toBe('running')
    expect(gate.ready.value, '旧重试污染了新会话状态').toBe(true)
    wrapper.unmount()
  })

  it('runOnStart=false 的步骤不阻塞初始就绪，只由 restart 触发', async () => {
    const { gate, wrapper } = withGate()
    const options = vi.fn(async () => {})
    gate.register('detail', async () => {})
    gate.register('options', options, { runOnStart: false })

    gate.start(1)
    await flushPromises()

    expect(options).not.toHaveBeenCalled()
    expect(gate.ready.value).toBe(true)

    gate.restart('options')
    await flushPromises()
    expect(options).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
