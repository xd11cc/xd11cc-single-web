import { describe, expect, it } from 'vitest'
import { RUNTIME_ICONS, buildSubset } from '../vite/icon-subset'

/**
 * 后端菜单图标的构建期登记。
 *
 * 菜单图标名来自后端（`meta.icon`），构建期扫不到源码里。若不登记，`AppIcon`
 * 遇到它们会去懒加载「完整集合」——lucide 80.5KB + ep 30.2KB（gzip），
 * 只为渲染十来个图标。登记成本约 2KB。
 *
 * 这里锁住两件事：登记项本身合法，且真的进了子集。
 */
describe('RUNTIME_ICONS', () => {
  it('登记项格式合法（prefix:name，且只有内置前缀）', () => {
    expect(RUNTIME_ICONS.length).toBeGreaterThan(0)
    for (const icon of RUNTIME_ICONS) {
      expect(icon).toMatch(/^(lucide|ep):[a-z0-9-]+$/)
    }
    // 不应有重复
    expect(new Set(RUNTIME_ICONS).size).toBe(RUNTIME_ICONS.length)
  })

  it('全部登记项都存在于对应图标集（防拼写错误）', () => {
    const { collections, missing } = buildSubset('src')
    const present = new Set(
      collections.flatMap((c) => Object.keys(c.icons).map((name) => `${c.prefix}:${name}`)),
    )
    for (const icon of RUNTIME_ICONS) {
      expect(present.has(icon)).toBe(true)
    }
    expect(missing).toEqual([])
  })

  it('不与源码扫描结果重复计数（同名只出现一次）', () => {
    const { collections } = buildSubset('src')
    for (const c of collections) {
      const names = Object.keys(c.icons)
      expect(new Set(names).size).toBe(names.length)
    }
  })
})
