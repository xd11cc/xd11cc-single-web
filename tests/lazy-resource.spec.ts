import { describe, expect, it, vi } from 'vitest'
import { createLazyLoader } from '@/common/composables/useLazyResource'

/**
 * 懒加载器（`createLazyLoader`）的契约。
 *
 * 这层封装要顶住三件事，任何一件失效都会让页面的「依赖就绪」判断失真：
 *  1) 并发调用只真正执行一次；
 *  2) 成功后不再重复请求；
 *  3) 失败**不能**把状态钉死，否则一次网络抖动就会让功能永久不可用。
 */
describe('createLazyLoader', () => {
  it('并发调用共享同一次加载', async () => {
    let resolve!: () => void
    const load = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r
        }),
    )
    const loader = createLazyLoader(load)

    const first = loader.ensure()
    const second = loader.ensure()
    resolve()

    await expect(first).resolves.toBe(true)
    await expect(second).resolves.toBe(true)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('成功后不再重复加载', async () => {
    const load = vi.fn(async () => {})
    const loader = createLazyLoader(load)

    await loader.ensure()
    await loader.ensure()

    expect(load).toHaveBeenCalledTimes(1)
    expect(loader.loaded).toBe(true)
  })

  it('失败返回 false，且允许下次重试（不会永久卡住）', async () => {
    const load = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(undefined)
    const loader = createLazyLoader(load)

    await expect(loader.ensure()).resolves.toBe(false)
    expect(loader.loaded).toBe(false)

    await expect(loader.ensure()).resolves.toBe(true)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('reset 后重新加载', async () => {
    const load = vi.fn(async () => {})
    const loader = createLazyLoader(load)

    await loader.ensure()
    loader.reset()
    expect(loader.loaded).toBe(false)

    await loader.ensure()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('加载体在 ensure 返回前已执行完（便于把 nextTick 放进去）', async () => {
    const order: string[] = []
    const loader = createLazyLoader(async () => {
      await Promise.resolve()
      order.push('load-done')
    })

    await loader.ensure().then(() => order.push('ensure-done'))

    expect(order).toEqual(['load-done', 'ensure-done'])
  })
})
