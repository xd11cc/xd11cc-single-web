import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/**
 * 登录态的会话一致性。
 *
 * getInfo 曾经直接落库：如果 A 的详情请求迟到，而此时用户已经登出并换成 B 登录，
 * 迟到响应会把 A 的用户 ID / 角色 / 权限写进 B 的会话（token 却是 B 的）。
 * 修复后落库前会比对 token，换过登录态就丢弃这次响应。
 */

const getUserInfoMock = vi.fn()
const loginMock = vi.fn()
const logoutMock = vi.fn()

vi.mock('@/views/login/apis/index', () => ({
  loginByPassword: (...args: unknown[]) => loginMock(...args),
  getUserInfo: () => getUserInfoMock(),
  logout: (...args: unknown[]) => logoutMock(...args),
}))

vi.mock('@@/utils/cache/cookies', () => {
  let store: string | undefined
  return {
    getToken: () => store,
    setToken: (v: string) => {
      store = v
    },
    removeToken: () => {
      store = undefined
    },
  }
})

// store 会通过 @/router 间接引入 guard（连带 i18n 实例），这里只关心 store 行为
vi.mock('@/router', () => ({ resetRouter: vi.fn(), publicRoutes: [] }))

import { useUserStore } from '@/pinia/stores/user'
import { getPermissionInitialization, setPermissionInitialization } from '@/router/permission-init'

function deferred<Value>() {
  let resolve!: (value: Value) => void
  const promise = new Promise<Value>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

const userInfo = (id: number, name: string) => ({
  data: {
    id,
    username: name,
    nickname: name,
    roles: [`${name}-role`],
    permissions: [`${name}:perm`],
  },
})

describe('getInfo 的会话一致性', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getUserInfoMock.mockReset()
    loginMock.mockReset()
    logoutMock.mockReset()
    logoutMock.mockResolvedValue(undefined)
  })

  it('登录态未变时正常落库', async () => {
    getUserInfoMock.mockResolvedValue(userInfo(1, 'alice'))
    const store = useUserStore()
    store.setToken('token-a')

    await store.getInfo()

    expect(store.userId).toBe(1)
    expect(store.username).toBe('alice')
    expect(store.permissions).toEqual(['alice:perm'])
  })

  it('请求期间换过 token（换号）时丢弃迟到响应', async () => {
    const pending = deferred<ReturnType<typeof userInfo>>()
    getUserInfoMock.mockReturnValue(pending.promise)

    const store = useUserStore()
    store.setToken('token-a')
    const info = store.getInfo()

    // 请求还没回来，用户已换成 B 登录
    store.setToken('token-b')

    pending.resolve(userInfo(1, 'alice'))
    await info

    expect(store.userId, 'A 的资料不应写进 B 的会话').toBe(0)
    expect(store.permissions).toEqual([])
    expect(store.roles).not.toContain('alice-role')
  })

  it('登出会重置权限初始化的单飞 Promise（否则换号会复用旧会话的初始化）', () => {
    setPermissionInitialization(Promise.resolve())
    expect(getPermissionInitialization()).not.toBeNull()

    const store = useUserStore()
    store.resetToken()

    expect(getPermissionInitialization()).toBeNull()
  })

  it('登出请求返回时若已换号，不得清掉新会话', async () => {
    const pending = deferred<void>()
    logoutMock.mockReturnValue(pending.promise)

    const store = useUserStore()
    store.setToken('token-a')
    const loggingOut = store.logout()

    // 登出请求还没回来，用户已经换 B 登录
    store.setToken('token-b')
    pending.resolve()
    await loggingOut

    expect(store.token, 'B 的登录态被旧登出清掉了').toBe('token-b')
  })

  it('登录态未变时登出会正常清理', async () => {
    const store = useUserStore()
    store.setToken('token-a')
    await store.logout()
    expect(store.token).toBe('')
  })

  it('请求期间登出（token 清空）时同样丢弃', async () => {
    const pending = deferred<ReturnType<typeof userInfo>>()
    getUserInfoMock.mockReturnValue(pending.promise)

    const store = useUserStore()
    store.setToken('token-a')
    const info = store.getInfo()

    store.resetToken()

    pending.resolve(userInfo(1, 'alice'))
    await info

    expect(store.userId).toBe(0)
    expect(store.token).toBe('')
  })
})
