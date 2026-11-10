import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const fixture = vi.hoisted(() => ({ token: '', getUserInfo: vi.fn() }))
vi.mock('@/views/login/apis/index', () => ({
  getUserInfo: () => fixture.getUserInfo(),
  loginByPassword: vi.fn(), logout: vi.fn(async () => ({ code: 200 })),
}))
vi.mock('@@/utils/cache/cookies', () => ({
  getToken: () => fixture.token,
  setToken: (value: string) => { fixture.token = value },
  removeToken: () => { fixture.token = '' },
}))
vi.mock('@/router', () => ({ resetRouter: vi.fn() }))
vi.mock('@/router/config', () => ({ routerConfig: { defaultRoles: ['default'] } }))
vi.mock('@/pinia/stores/settings', () => ({ useSettingsStore: () => ({ cacheTagsView: false }) }))
vi.mock('@/pinia/stores/tags-view', () => ({ useTagsViewStore: () => ({ delAllVisitedViews: vi.fn(), delAllCachedViews: vi.fn() }) }))
vi.mock('@/pinia/stores/permission', () => ({ usePermissionStore: () => ({ reset: vi.fn() }) }))
vi.mock('@/common/utils/request', () => ({ resetUnauthorizedHandling: vi.fn() }))
import { useUserStore } from '@/pinia/stores/user'

function deferred() { let resolve!: (value: any) => void; const promise = new Promise<any>(done => { resolve = done }); return { promise, resolve } }
function user(id: number) { return { code: 200, data: { id, username: `review-${id}`, roles: [`role-${id}`], permissions: [`permission-${id}`] } } }
beforeEach(() => { fixture.token = ''; fixture.getUserInfo.mockReset(); setActivePinia(createPinia()) })

describe('继续评估：当前用户会话', () => {
  it('退出登录应使之前挂起的用户资料响应失效', async () => {
    const pending = deferred()
    const store = useUserStore()
    store.setToken('review-fixture-A')
    fixture.getUserInfo.mockReturnValueOnce(pending.promise)
    const loading = store.getInfo()
    store.resetToken()
    pending.resolve(user(1))
    await loading
    expect(store.token).toBe('')
    expect(store.userId).toBe(0)
    expect(store.roles).toEqual([])
  })

  it('B 登录后，A 的迟到用户资料响应不应覆盖 B', async () => {
    const pending = deferred()
    const store = useUserStore()
    store.setToken('review-fixture-A')
    fixture.getUserInfo.mockReturnValueOnce(pending.promise)
    const loadingA = store.getInfo()
    store.resetToken()
    store.setToken('review-fixture-B')
    fixture.getUserInfo.mockResolvedValueOnce(user(2))
    await store.getInfo()
    pending.resolve(user(1))
    await loadingA
    expect(store.token).toBe('review-fixture-B')
    expect(store.userId).toBe(2)
    expect(store.roles).toEqual(['role-2'])
  })
})
