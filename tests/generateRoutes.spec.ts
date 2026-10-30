import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteVO } from '@/views/login/apis/type'

/**
 * 动态路由转换的接口测试。
 *
 * generateRoutes(fetchRoutes) 的依赖是注入的，所以不需要 mock HTTP 就能验证：
 *  1) noRedirect 哨兵会被换成「第一个可见子页」的真实路径；
 *  2) 视图路由默认 keepAlive=true、目录为 false；
 *  3) 菜单里的组件字符串能被解析成组件（glob），解析不到时走 MissingView 并打日志。
 */

import { usePermissionStore } from '@/pinia/stores/permission'

const fakeRoutes: RouteVO[] = [
  {
    id: 1,
    parentId: null,
    name: 'Approval',
    path: '/approval',
    component: 'Layout',
    redirect: 'noRedirect',
    meta: { title: '审批管理' },
    children: [
      {
        id: 2,
        parentId: 1,
        name: 'ApprovalHidden',
        path: 'hidden',
        component: 'approval/done/index',
        meta: { title: '隐藏页', hidden: true } as any,
      },
      {
        id: 3,
        parentId: 1,
        name: 'ApprovalStarted',
        path: 'started',
        component: 'approval/started/index',
        meta: { title: '我发起的' },
      },
    ],
  },
]

describe('动态路由转换', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('目录的 noRedirect 被替换为第一个可见子页路径', async () => {
    const store = usePermissionStore()
    const routes = await store.generateRoutes(async () => ({ code: 200, msg: 'ok', data: fakeRoutes }))

    expect(routes[0].redirect).toBe('/approval/started')
    // 未知路由 key 不应残留哨兵值
    expect(routes[0].redirect).not.toBe('noRedirect')
  })

  it('视图路由默认缓存、目录不缓存', async () => {
    const store = usePermissionStore()
    const routes = await store.generateRoutes(async () => ({ code: 200, msg: 'ok', data: fakeRoutes }))

    expect(routes[0].meta?.keepAlive).toBe(false)
    const started = routes[0].children?.find((r) => r.name === 'ApprovalStarted')
    expect(started?.meta?.keepAlive).toBe(true)
  })

  it('菜单里的组件字符串能解析为组件', async () => {
    const store = usePermissionStore()
    const routes = await store.generateRoutes(async () => ({ code: 200, msg: 'ok', data: fakeRoutes }))

    const started = routes[0].children?.find((r) => r.name === 'ApprovalStarted')
    expect(started?.component).toBeTypeOf('function')
  })

  it('组件路径写错时给出可诊断的回落组件', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const store = usePermissionStore()

    const routes = await store.generateRoutes(async () => ({
      code: 200,
      msg: 'ok',
      data: [
        {
          id: 9,
          parentId: null,
          name: 'Broken',
          path: '/broken',
          component: 'system/not-exist/index',
          meta: { title: '写错的菜单' },
        },
      ],
    }))

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('菜单配置的组件不存在'))
    // MissingView 是一个组件对象（而不是什么都没渲染）
    expect(typeof routes[0].component).toBe('object')
    errorSpy.mockRestore()
  })
})
