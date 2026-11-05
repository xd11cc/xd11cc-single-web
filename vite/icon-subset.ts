import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

/**
 * 图标按需加载。
 *
 * 问题：`src/plugins/iconify.ts` 以前把 lucide（1774 个图标）+ ep 的完整集合
 * 一次性 `addCollection` 进入口，入口 chunk 里约 114KB（gzip）是图标 JSON，
 * 而源码真正用到的只有 90 来个。
 *
 * 做法：
 *  1. 构建期扫描 `src/**\/*.{ts,vue}` 里出现的 `lucide:xxx` / `ep:xxx` 字面量，
 *     从 `@iconify-json/*` 里只挑这些图标，生成 `virtual:icon-subset`
 *     （随入口同步注册，常用图标零延迟）；
 *  2. 后端菜单等运行时才知道的图标，走 `virtual:icon-full`（完整集合，
 *     独立 chunk，首次遇到未知图标时才按需 import，离线仍可用）；
 *  3. `virtual:icon-names` 只导出图标名（供图标选择器列表用，避免把
 *     543KB 的完整 JSON 拉进菜单页）。
 *
 * 全量 JSON 在构建期用 Node 读盘、以字面量形式生成代码，
 * 所以最终产物里只会包含真正用到的图标，不会因为 import 了 icons.json 而全量打包。
 */

const SUBSET_ID = 'virtual:icon-subset'
const NAMES_ID = 'virtual:icon-names'
const FULL_PREFIX = 'virtual:icon-full-'
const RESOLVED = new Set([SUBSET_ID, NAMES_ID])

// 前面不能是标识符字符，也不能是 URL/路径里的 '/' ':'（避免把链接里的字样当图标）
const ICON_RE = /(?<![\w/:-])((?:lucide|ep):[a-z0-9-]+)/g
const SOURCE_EXT = /\.(vue|ts)$/

interface IconifyCollection {
  prefix: string
  width?: number
  height?: number
  icons: Record<string, unknown>
  aliases?: Record<string, unknown>
}

/**
 * 扫描目录下所有源码里出现的图标名。
 * 导出成独立函数便于单测（不依赖 Vite 运行时）。
 */
export function scanIconNames(rootDir: string): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>()
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
        continue
      }
      if (!SOURCE_EXT.test(entry)) continue
      const code = readFileSync(full, 'utf-8')
      for (const match of code.matchAll(ICON_RE)) {
        const [prefix, name] = match[1].split(':')
        if (!found.has(prefix)) found.set(prefix, new Set())
        found.get(prefix)!.add(name)
      }
    }
  }
  walk(rootDir)
  return found
}

function loadCollection(prefix: string): IconifyCollection | null {
  const file = resolve(process.cwd(), `node_modules/@iconify-json/${prefix}/icons.json`)
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf-8')) as IconifyCollection
}

interface Subset {
  collections: IconifyCollection[]
  lucideNames: string[]
  epNames: string[]
  missing: string[]
}

/**
 * 只保留被引用的图标。别名（alias）要连同它指向的父图标一起带上，
 * 否则 `lucide:xxx` 正好是别名时渲染为空。
 */
export function buildSubset(rootDir: string): Subset {
  const used = scanIconNames(rootDir)
  const collections: IconifyCollection[] = []
  const lucideNames: string[] = []
  const epNames: string[] = []
  const missing: string[] = []

  for (const [prefix, names] of used) {
    const source = loadCollection(prefix)
    if (!source) continue
    const icons: Record<string, unknown> = {}
    const aliases: Record<string, unknown> = {}

    for (const name of names) {
      if (source.icons[name]) {
        icons[name] = source.icons[name]
        continue
      }
      const alias = source.aliases?.[name] as { parent?: string } | undefined
      const parent = alias?.parent
      if (parent && source.icons[parent]) {
        aliases[name] = alias
        icons[parent] = source.icons[parent]
      } else {
        missing.push(`${prefix}:${name}`)
      }
    }

    collections.push({
      prefix,
      width: source.width,
      height: source.height,
      icons,
      ...(Object.keys(aliases).length ? { aliases } : {}),
    })

    const allNames = Object.keys(source.icons).map((name) => `${prefix}:${name}`)
    if (prefix === 'lucide') lucideNames.push(...allNames)
    if (prefix === 'ep') epNames.push(...allNames)
  }

  return { collections, lucideNames, epNames, missing }
}

function renderSubset(rootDir: string): string {
  const { collections, missing } = buildSubset(rootDir)
  if (missing.length) {
    // 名字写错时不要静默：构建期直接提示，否则线上只会看到一个空白图标
    console.warn(`[icon-subset] 源码里引用了不存在的图标：${missing.join(', ')}`)
  }
  return `export default ${JSON.stringify(collections)}`
}

function renderNames(rootDir: string): string {
  const { lucideNames, epNames } = buildSubset(rootDir)
  return [
    `export const lucideNames = ${JSON.stringify(lucideNames)}`,
    `export const epNames = ${JSON.stringify(epNames)}`,
  ].join('\n')
}

function renderFull(prefix: string): string {
  return `export default ${JSON.stringify(loadCollection(prefix))}`
}

export function iconSubsetPlugin(): Plugin {
  let rootDir = ''

  return {
    name: 'dsh:icon-subset',
    enforce: 'pre',
    configResolved(config) {
      rootDir = resolve(config.root, 'src')
    },
    resolveId(id) {
      if (RESOLVED.has(id) || id.startsWith(FULL_PREFIX)) return `\0${id}`
      return null
    },
    load(id) {
      if (id === `\0${SUBSET_ID}`) return renderSubset(rootDir)
      if (id === `\0${NAMES_ID}`) return renderNames(rootDir)
      if (id.startsWith(`\0${FULL_PREFIX}`)) return renderFull(id.slice(FULL_PREFIX.length + 1))
      return null
    },
    configureServer(server: ViteDevServer) {
      // 新增/修改源码里出现新图标时，让虚拟模块失效重算
      const invalidate = (file: string) => {
        if (!SOURCE_EXT.test(file) || !file.startsWith(rootDir)) return
        for (const id of [SUBSET_ID, NAMES_ID]) {
          const mod = server.moduleGraph.getModuleById(`\0${id}`)
          if (mod) server.moduleGraph.invalidateModule(mod)
        }
      }
      server.watcher.on('change', invalidate)
      server.watcher.on('add', invalidate)
    },
  }
}
