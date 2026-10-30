import { beforeEach, describe, expect, it } from 'vitest'
import { CacheKey } from '@@/constants/cache-key'
import {
  getCachedViews,
  getVisitedViews,
  setCachedViews,
  setVisitedViews,
} from '@@/utils/cache/local-storage'

/**
 * 标签栏缓存的读写。
 *
 * 这里钉死一个曾经导致「登录后整个布局白屏」的 bug：
 * getItem() 内部已经 JSON.parse 过，若再 parse 一次，
 * 空数组会被 String([]) 转成空串，抛 `Unexpected end of JSON input`，
 * 而这段代码在 Pinia store 初始化阶段执行，会直接炸掉整个布局。
 */
describe('标签栏缓存读写', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('localStorage 为空时返回空数组', () => {
    expect(getCachedViews()).toEqual([])
    expect(getVisitedViews()).toEqual([])
  })

  it('存入空数组后能安全读回（原崩溃点）', () => {
    setCachedViews([])
    expect(() => getCachedViews()).not.toThrow()
    expect(getCachedViews()).toEqual([])
  })

  it('正常写入与读取', () => {
    setCachedViews(['ApprovalTodo', 'User'])
    expect(getCachedViews()).toEqual(['ApprovalTodo', 'User'])
  })

  it('数据损坏时降级为空数组而不是抛错', () => {
    window.localStorage.setItem(CacheKey.CACHED_VIEW, '损坏数据')
    expect(getCachedViews()).toEqual([])
  })

  it('存成非数组时降级为空数组', () => {
    window.localStorage.setItem(CacheKey.CACHED_VIEW, JSON.stringify({ a: 1 }))
    expect(getCachedViews()).toEqual([])
  })

  it('visitedViews 往返保持顺序', () => {
    setVisitedViews([
      { path: '/dashboard', fullPath: '/dashboard', name: 'Dashboard', title: '首页' },
      { path: '/system/user', fullPath: '/system/user', name: 'User', title: '用户管理' },
    ] as any)

    expect(getVisitedViews().map((v: any) => v.path)).toEqual(['/dashboard', '/system/user'])
  })
})
