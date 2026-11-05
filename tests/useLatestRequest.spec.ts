import { describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { useLatestRequest } from '@@/composables/useLatestRequest'

/**
 * 过期响应守卫：列表壳与树形壳共用的那一份。
 *
 * 关键不变量：
 *  - 新请求一发出，旧请求立即过期；
 *  - 作用域销毁后，所有在途请求都必须被判定为过期（否则会在卸载后写状态）。
 */
describe('useLatestRequest', () => {
  it('只有最新一次请求是最新的', () => {
    const scope = effectScope()
    const guard = scope.run(() => useLatestRequest())!

    const first = guard.begin()
    expect(guard.isCurrent(first)).toBe(true)

    const second = guard.begin()
    expect(guard.isCurrent(first)).toBe(false)
    expect(guard.isCurrent(second)).toBe(true)

    scope.stop()
  })

  it('作用域销毁时在途请求全部作废', () => {
    const scope = effectScope()
    const guard = scope.run(() => useLatestRequest())!

    const pending = guard.begin()
    expect(guard.isCurrent(pending)).toBe(true)

    scope.stop()

    expect(guard.isCurrent(pending)).toBe(false)
    expect(guard.isDisposed()).toBe(true)
  })

  it('销毁后再发起请求也不会被当成最新', () => {
    const scope = effectScope()
    const guard = scope.run(() => useLatestRequest())!

    scope.stop()
    const late = guard.begin()

    expect(guard.isCurrent(late)).toBe(false)
  })
})
