import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * request.ts 的接口测试。
 *
 * 这个模块服务 24 个调用文件，此前完全没有护栏。覆盖四类行为：
 *  1) 请求拦截器注入 token；
 *  2) 业务码非 200 时的提示与 reject（msg 优先、缺失时回退本地化文案）；
 *  3) 401 的并发去重（多个请求同时 401 只处理一次）；
 *  4) 超时 / 网络错误的文案分支。
 */

// vi.mock 的工厂会被提升到 import 之前执行，所以共享状态必须用 vi.hoisted 提前创建，
// 否则工厂里访问到的还是 TDZ 中的 const。
const h = vi.hoisted(() => {
  const requestHandlers: Array<{ ok: any; err: any }> = []
  const responseHandlers: Array<{ ok: any; err: any }> = []
  const instanceCalls: any[] = []
  const state: { config: any } = { config: undefined }

  const instance: any = (config: any) => {
    instanceCalls.push(config)
    return Promise.resolve({ data: { code: 200, msg: 'ok', data: 'payload' } })
  }
  instance.interceptors = {
    request: { use: (ok: any, err: any) => requestHandlers.push({ ok, err }) },
    response: { use: (ok: any, err: any) => responseHandlers.push({ ok, err }) },
  }

  return { requestHandlers, responseHandlers, instanceCalls, state, instance }
})

vi.mock('axios', () => ({
  default: {
    create: (config: any) => {
      h.state.config = config
      return h.instance
    },
  },
}))

const errorMessage = vi.fn()
const warningMessage = vi.fn()
vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return {
    ...actual,
    ElMessage: {
      error: (...args: any[]) => errorMessage(...args),
      warning: (...args: any[]) => warningMessage(...args),
    },
  }
})

vi.mock('@/i18n', () => ({ i18n: { global: { t: (key: string) => key } } }))

const resetToken = vi.fn()
vi.mock('@/pinia/stores/user', () => ({ useUserStore: () => ({ resetToken }) }))

const routerReplace = vi.fn()
const nav = { path: '/system/user' }
vi.mock('@/router', () => ({
  router: {
    currentRoute: {
      get value() {
        return { fullPath: nav.path }
      },
    },
    replace: (...args: any[]) => routerReplace(...args),
  },
}))

const auth = { token: 'token-abc' }
vi.mock('@@/utils/cache/cookies', () => ({ getToken: () => auth.token }))

import request, {
  handleUnauthorized,
  resetUnauthorizedHandling,
  LONG_REQUEST_TIMEOUT,
} from '@@/utils/request'
import { isUnauthorizedError } from '@@/utils/unauthorized'

const requestInterceptor = () => h.requestHandlers[0].ok
const responseOk = () => h.responseHandlers[0].ok
const responseErr = () => h.responseHandlers[0].err

describe('request 封装', () => {
  beforeEach(() => {
    errorMessage.mockClear()
    warningMessage.mockClear()
    resetToken.mockClear()
    routerReplace.mockClear()
    nav.path = '/system/user'
    auth.token = 'token-abc'
    resetUnauthorizedHandling()
  })

  it('实例使用 10s 默认超时，长任务常量是 60s', () => {
    expect(h.state.config.timeout).toBe(10_000)
    expect(LONG_REQUEST_TIMEOUT).toBe(60_000)
  })

  it('有 token 时注入 Authorization 头', () => {
    const config: any = { headers: {} }
    const result: any = requestInterceptor()(config)
    expect(result.headers.Authorization).toBe('Bearer token-abc')
  })

  it('没有 token 时不注入 Authorization 头', () => {
    auth.token = null as any
    const config: any = { headers: {} }
    requestInterceptor()(config)
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('业务成功时原样返回响应体', () => {
    expect(responseOk()({ data: { code: 200, data: 'ok' } })).toEqual({ code: 200, data: 'ok' })
  })

  it('业务失败时优先使用后端 msg 并 reject', async () => {
    await expect(responseOk()({ data: { code: 500, msg: '自定义错误' } })).rejects.toThrow(
      '自定义错误',
    )
    expect(errorMessage).toHaveBeenCalledWith('自定义错误')
  })

  it('后端没给 msg 时回退本地化文案', async () => {
    await expect(responseOk()({ data: { code: 403 } })).rejects.toThrow('common.network.forbidden')
    expect(errorMessage).toHaveBeenCalledWith('common.network.forbidden')
  })

  it('业务 401 触发登录跳转，且只弹 warning 不弹 error', async () => {
    await expect(responseOk()({ data: { code: 401, msg: 'expired' } })).rejects.toThrow('expired')

    expect(warningMessage).toHaveBeenCalledTimes(1)
    expect(errorMessage).not.toHaveBeenCalled()
    expect(resetToken).toHaveBeenCalledTimes(1)
    expect(routerReplace).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/system/user' },
    })
  })

  it('旧的 401（发起时用的不是当前 token）不会清掉新登录态', () => {
    // 期间换了账号：当前 token 已是 token-new
    auth.token = 'token-new'

    handleUnauthorized('token-old')

    expect(resetToken, 'B 的登录态被旧会话的 401 清掉了').not.toHaveBeenCalled()
    expect(routerReplace).not.toHaveBeenCalled()
  })

  it('响应里的旧 Authorization 触发 401 时同样被忽略', async () => {
    auth.token = 'token-new'
    const staleResponse = {
      data: { code: 401, msg: 'expired' },
      config: { headers: { Authorization: 'Bearer token-old' } },
    }

    await expect(responseOk()(staleResponse)).rejects.toThrow('expired')

    expect(resetToken).not.toHaveBeenCalled()
  })

  it('token 未变时 401 正常清理', () => {
    handleUnauthorized('token-abc')
    expect(resetToken).toHaveBeenCalledTimes(1)
  })

  it('并发 401 只处理一次（避免重复跳转）', () => {
    handleUnauthorized()
    handleUnauthorized()
    handleUnauthorized()

    expect(warningMessage).toHaveBeenCalledTimes(1)
    expect(routerReplace).toHaveBeenCalledTimes(1)
  })

  it('登录成功后解锁，可以再次处理 401', () => {
    handleUnauthorized()
    resetUnauthorizedHandling()
    handleUnauthorized()

    expect(warningMessage).toHaveBeenCalledTimes(2)
  })

  it('已经在登录页时不再重复跳转', () => {
    nav.path = '/login'
    handleUnauthorized()

    expect(resetToken).toHaveBeenCalledTimes(1)
    expect(routerReplace).not.toHaveBeenCalled()
  })

  it('HTTP 401 同样触发登录跳转', async () => {
    await expect(responseErr()({ response: { status: 401 } })).rejects.toBeTruthy()

    expect(warningMessage).toHaveBeenCalledTimes(1)
    expect(errorMessage).not.toHaveBeenCalled()
  })

  it('超时给出专门的提示并带 3s 时长', async () => {
    const error = Object.assign(new Error('timeout of 10000ms exceeded'), { code: 'ECONNABORTED' })
    await expect(responseErr()(error)).rejects.toBe(error)

    expect(errorMessage).toHaveBeenCalledWith({
      message: 'common.network.timeout',
      duration: 3000,
    })
  })

  it('无响应体的网络错误回退到 unknown 文案', async () => {
    const error = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })
    await expect(responseErr()(error)).rejects.toBe(error)

    expect(errorMessage).toHaveBeenCalledWith('common.network.unknown')
  })

  it('默认导出可被调用（get/post 都走它）', async () => {
    await request({ url: '/x', method: 'GET' } as any)
    expect(h.instanceCalls.at(-1)).toMatchObject({ url: '/x', method: 'GET' })
  })

  // ==================== 后端 msg 优先（本次改动）====================

  it('HTTP 403 使用后端 msg，而不是泛化的状态码文案', async () => {
    const error = {
      response: { status: 403, data: { code: 1001011, msg: '没有操作权限' } },
    }

    await expect(responseErr()(error)).rejects.toBe(error)

    expect(errorMessage).toHaveBeenCalledWith('没有操作权限')
    expect(errorMessage).not.toHaveBeenCalledWith('common.network.forbidden')
  })

  it('HTTP 400 同样透出后端的字段级报错', async () => {
    const error = {
      response: { status: 400, data: { code: 400, msg: '请求参数有误：用户名不能为空' } },
    }

    await expect(responseErr()(error)).rejects.toBe(error)

    expect(errorMessage).toHaveBeenCalledWith('请求参数有误：用户名不能为空')
  })

  it('后端 500 没有 ResponseVO 信封时回退到本地化文案', async () => {
    // Spring 默认错误页是 {timestamp,status,error,path}，没有 msg 字段
    const error = {
      response: { status: 500, data: { status: 500, error: 'Internal Server Error' } },
    }

    await expect(responseErr()(error)).rejects.toBe(error)

    expect(errorMessage).toHaveBeenCalledWith('common.network.serverError')
  })

  // ==================== 401 标记（供路由守卫去重）====================

  it('HTTP 401 会被标记为已处理，守卫据此不再重复提示', async () => {
    const error: any = { response: { status: 401, data: { code: 401, msg: '未授权' } } }

    await expect(responseErr()(error)).rejects.toBe(error)

    expect(isUnauthorizedError(error)).toBe(true)
    // 401 只弹 warning，不弹 error
    expect(warningMessage).toHaveBeenCalledTimes(1)
    expect(errorMessage).not.toHaveBeenCalled()
  })

  it('业务码 401 的 reject 值同样带已处理标记', async () => {
    const rejected = await responseOk()({ data: { code: 401, msg: 'expired' } }).catch(
      (e: unknown) => e,
    )

    expect(isUnauthorizedError(rejected)).toBe(true)
  })

  it('非 401 的失败不会被误判为已处理（守卫仍会提示）', async () => {
    const error: any = { response: { status: 500, data: { msg: 'boom' } } }

    await expect(responseErr()(error)).rejects.toBe(error)

    expect(isUnauthorizedError(error)).toBe(false)
  })
})
