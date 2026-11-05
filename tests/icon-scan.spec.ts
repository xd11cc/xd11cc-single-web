import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildSubset, scanIconNames } from '../vite/icon-subset'

/**
 * 图标子集扫描。
 *
 * 这套逻辑决定「打包进去哪些图标」，一旦漏扫，线上表现是一个空白图标（不报错），
 * 所以这里既测扫描规则，也用真实源码做一次完整性断言。
 */
describe('scanIconNames', () => {
  it('只抓 lucide:/ep: 字面量，忽略相似文本', () => {
    const dir = mkdtempSync(join(tmpdir(), 'icon-scan-'))
    mkdirSync(join(dir, 'views'))
    writeFileSync(
      join(dir, 'App.vue'),
      `<Icon icon="lucide:search" />
<Icon :icon="'ep:edit'" />
<el-button icon="lucide:plus" />
const notIcon = 'notlucide:fake'
const url = 'https://example.com/lucide:xx'
<AppIcon :icon="dynamicName" />`,
    )
    writeFileSync(join(dir, 'views', 'a.ts'), `export const icons = ['lucide:trash-2', 'ep:delete']`)

    const found = scanIconNames(dir)

    expect([...found.get('lucide')!].sort()).toEqual(['plus', 'search', 'trash-2'])
    expect([...found.get('ep')!].sort()).toEqual(['delete', 'edit'])
  })
})

describe('buildSubset', () => {
  it('真实源码里的图标都能在图标集中找到（防拼写错误）', () => {
    const { missing } = buildSubset('src')
    expect(missing).toEqual([])
  })

  it('只打包用到的图标，而不是整套集合', () => {
    const { collections } = buildSubset('src')
    const total = collections.reduce((sum, c) => sum + Object.keys(c.icons).length, 0)

    // 整套 lucide 是 1774 个；这里应当只包含源码引用过的量级
    expect(total).toBeGreaterThan(50)
    expect(total).toBeLessThan(250)
  })

  it('别名会连同父图标一起带上（否则别名渲染为空）', () => {
    const source = JSON.parse(
      readFileSync('node_modules/@iconify-json/lucide/icons.json', 'utf-8'),
    ) as { icons: Record<string, unknown>; aliases?: Record<string, { parent: string }> }
    const [aliasName, alias] = Object.entries(source.aliases ?? {}).find(
      ([, item]) => item.parent && source.icons[item.parent],
    )!

    const dir = mkdtempSync(join(tmpdir(), 'icon-alias-'))
    writeFileSync(join(dir, 'a.vue'), `<Icon icon="lucide:${aliasName}" />`)

    const { collections, missing } = buildSubset(dir)
    const lucide = collections.find((c) => c.prefix === 'lucide')!

    expect(missing).toEqual([])
    expect(lucide.aliases?.[aliasName]).toBeDefined()
    expect(Object.keys(lucide.icons)).toContain(alias.parent)
  })
})
