import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { AxiosError, AxiosHeaders } from 'axios'

const fixture = vi.hoisted(() => ({ token: 'token-a', resetToken: vi.fn(), replace: vi.fn() }))
vi.mock('@@/utils/cache/cookies', () => ({ getToken: () => fixture.token }))
vi.mock('@/pinia/stores/user', () => ({ useUserStore: () => ({ get token() { return fixture.token }, resetToken: () => fixture.resetToken() }) }))
vi.mock('@/router', () => ({ router: { currentRoute: { value: { fullPath: '/protected-b' } }, replace: (target: any) => fixture.replace(target) } }))
vi.mock('@/i18n', () => ({ i18n: { global: { t: (key: string) => key } } }))
vi.mock('element-plus', () => ({ ElMessage: { warning: vi.fn(), error: vi.fn() } }))
import request, { resetUnauthorizedHandling } from '@@/utils/request'

function deferred() {
  let resolve!: (value: any) => void
  let reject!: (error: any) => void
  const promise = new Promise<any>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}
beforeEach(() => {
  fixture.token = 'token-a'
  fixture.resetToken.mockReset().mockImplementation(() => { fixture.token = '' })
  fixture.replace.mockReset()
  resetUnauthorizedHandling()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

describe('本轮新增：实际 Axios 请求的登录会话', () => {
  it('A 的迟到业务 401 不应清掉已经登录的 B', async () => {
    const pending = deferred()
    let sent: any
    const requesting = request({ url: '/review/a', adapter: config => { sent = config; return pending.promise } }).catch(error => error)
    await flushPromises()
    expect(sent.headers.Authorization).toBe('Bearer token-a')
    fixture.token = 'token-b'
    resetUnauthorizedHandling()
    pending.resolve({ config: sent, status: 200, statusText: 'OK', headers: new AxiosHeaders(), data: { code: 401, msg: 'A expired' } })
    await requesting
    expect(fixture.token).toBe('token-b')
    expect(fixture.resetToken).not.toHaveBeenCalled()
    expect(fixture.replace).not.toHaveBeenCalled()
  })

  it('A 的迟到 HTTP 401 不应清掉已经登录的 B', async () => {
    const pending = deferred()
    let sent: any
    const requesting = request({ url: '/review/a', adapter: config => { sent = config; return pending.promise } }).catch(error => error)
    await flushPromises()
    expect(sent.headers.Authorization).toBe('Bearer token-a')
    fixture.token = 'token-b'
    resetUnauthorizedHandling()
    pending.reject(new AxiosError('A expired', 'ERR_BAD_REQUEST', sent, undefined, { config: sent, status: 401, statusText: 'Unauthorized', headers: new AxiosHeaders(), data: {} }))
    await requesting
    expect(fixture.token).toBe('token-b')
    expect(fixture.resetToken).not.toHaveBeenCalled()
  })

  it.each(['business', 'http'] as const)(
    '未认证请求的迟到 %s 401 不应清掉后来登录的 B',
    async (kind) => {
      fixture.token = ''
      const pending = deferred()
      let sent: any
      const requesting = request({
        url: '/review/public',
        adapter: (config) => {
          sent = config
          return pending.promise
        },
      }).catch((error) => error)
      await flushPromises()
      expect(sent.headers.Authorization).toBeUndefined()

      fixture.token = 'token-b'
      resetUnauthorizedHandling()
      if (kind === 'business') {
        pending.resolve({
          config: sent,
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          data: { code: 401, msg: 'Unauthenticated request expired' },
        })
      } else {
        pending.reject(
          new AxiosError(
            'Unauthenticated request expired',
            'ERR_BAD_REQUEST',
            sent,
            undefined,
            {
              config: sent,
              status: 401,
              statusText: 'Unauthorized',
              headers: new AxiosHeaders(),
              data: {},
            },
          ),
        )
      }
      await requesting

      expect(fixture.token).toBe('token-b')
      expect(fixture.resetToken).not.toHaveBeenCalled()
      expect(fixture.replace).not.toHaveBeenCalled()
    },
  )

  it('对照：当前账号的 401 仍应清理登录态', async () => {
    fixture.token = 'token-b'
    const requesting = request({ url: '/review/b', adapter: async config => ({ config, status: 200, statusText: 'OK', headers: new AxiosHeaders(), data: { code: 401, msg: 'B expired' } }) }).catch(error => error)
    await requesting
    expect(fixture.token).toBe('')
    expect(fixture.resetToken).toHaveBeenCalledTimes(1)
    expect(fixture.replace).toHaveBeenCalledTimes(1)
  })
})
