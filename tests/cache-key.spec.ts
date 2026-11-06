import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CacheKey } from '@@/constants/cache-key'

/**
 * 缓存键的环境区分。
 *
 * 曾经这里写的是 `import.meta.env.NODE_ENV`——**这个键在 Vite 里根本不存在**
 * （Vite 只注入 BASE_URL / MODE / DEV / PROD / SSR 与 VITE_ 开头的变量），
 * 于是线上真实键名是 `管理后台-undefined-token-key`。
 *
 * 注意：**单测环境抓不到这个 bug**。vitest 会把整个 process.env 铺进 import.meta.env，
 * 所以这里 NODE_ENV 恰好等于 'test'，跑 `expect(key).not.toContain('undefined')`
 * 也能通过——那正是它当初溜过测试的原因。因此下面同时做源码级断言。
 */
describe('CacheKey 环境区分', () => {
  const source = readFileSync(join(process.cwd(), 'src/common/constants/cache-key.ts'), 'utf8')

  it('不使用 Vite 不会注入的 NODE_ENV 键', () => {
    // Vite 只把 VITE_ 开头的变量暴露给客户端代码，NODE_ENV 不在其中
    expect(source).not.toMatch(/import\.meta\.env\.NODE_ENV/)
  })

  it('使用 MODE 作为环境标识（Vite 保证注入）', () => {
    expect(source).toMatch(/import\.meta\.env\.MODE/)
  })

  it('所有键都非空、不含 undefined / null / NaN', () => {
    const keys = Object.entries(CacheKey)
    expect(keys.length).toBeGreaterThan(0)

    for (const [name, value] of keys) {
      expect(typeof value, `${name} 应为字符串`).toBe('string')
      expect(value, `${name} 不应为空`).not.toBe('')
      expect(value, `${name} 含 undefined`).not.toContain('undefined')
      expect(value, `${name} 含 null`).not.toContain('null')
      expect(value, `${name} 含 NaN`).not.toContain('NaN')
      // 键里不应出现连续分隔符（说明有一段插值成了空串）
      expect(value, `${name} 有空的插值段`).not.toMatch(/--/)
    }
  })

  it('所有键互不相同', () => {
    const values = Object.values(CacheKey)
    expect(new Set(values).size).toBe(values.length)
  })

  it('键里带当前环境标识（同环境内可稳定复用）', () => {
    expect(CacheKey.TOKEN).toContain(import.meta.env.MODE)
  })

  it('.env 文件里没有再写回 NODE_ENV', () => {
    // Vite 只把 VITE_ 开头的变量注入客户端，NODE_ENV 不生效；
    // 它还会被当成构建模式信号并触发告警，所以三个环境文件里都不该出现。
    for (const file of ['.env.dev', '.env.test', '.env.prod']) {
      const content = readFileSync(join(process.cwd(), file), 'utf8')
      expect(content, `${file} 里不应有 NODE_ENV=`).not.toMatch(/^\s*NODE_ENV\s*=/m)
    }
  })
})
