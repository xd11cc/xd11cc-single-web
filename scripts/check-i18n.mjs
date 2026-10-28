#!/usr/bin/env node
/**
 * i18n 一致性校验。
 *
 * 用法：node scripts/check-i18n.mjs    （或 pnpm check:i18n）
 * 打包时会由 vite.config.ts 的 i18n-check 插件自动调用，失败即中断构建。
 *
 * 校验三件事：
 *   1. zh-CN / en-US 的 key 集合完全一致（缺失/多余都会失败）
 *   2. 同一 key 两侧的占位符（{name} / {count}）一致
 *   3. 非空字符串（空值会让界面出现空白）
 *
 * 说明：locales 是 TypeScript 模块，这里用项目自带的 typescript 转译后加载，
 * 不引入额外依赖。
 */
import fs from 'node:fs'
import path from 'node:path'
import Module from 'node:module'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const entry = path.join(root, 'src/i18n/locales/index.ts')

// 从项目 node_modules 解析 typescript，避免依赖全局安装
const require = Module.createRequire(path.join(root, 'package.json'))
const ts = require('typescript')

const cache = new Map()

function loadTs(file) {
  if (cache.has(file)) return cache.get(file).exports

  const source = fs.readFileSync(file, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: file,
  })

  const mod = new Module(file)
  mod.filename = file
  mod.paths = Module._nodeModulePaths(path.dirname(file))
  cache.set(file, mod)

  mod.require = (specifier) => {
    if (!specifier.startsWith('.')) return require(specifier)
    let target = path.resolve(path.dirname(file), specifier)
    if (!target.endsWith('.ts')) target += '.ts'
    return loadTs(target)
  }

  mod._compile(outputText, file)
  return mod.exports
}

function flatten(node, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(node)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, full, out)
    else out[full] = value
  }
  return out
}

/**
 * 允许为空的 key。
 * 少数文案在某种语言里天然没有对应词（例如中文量词在英文里没有对应）。
 * 这类情况必须显式登记，否则空值会被当成漏翻。
 * 目前为空（原登记项随 CronGenerator 一并删除），保留结构以便后续使用。
 */
const ALLOW_EMPTY = new Set()

const { zhCN, enUS } = loadTs(entry)
const zh = flatten(zhCN)
const en = flatten(enUS)

const problems = []
const zhKeys = new Set(Object.keys(zh))
const enKeys = new Set(Object.keys(en))

for (const key of zhKeys) {
  if (!enKeys.has(key)) problems.push(`缺少英文: ${key}`)
}
for (const key of enKeys) {
  if (!zhKeys.has(key)) problems.push(`缺少中文: ${key}`)
}

const placeholders = (value) =>
  typeof value === 'string'
    ? [...value.matchAll(/\{(\w+)\}/g)]
        .map((m) => m[1])
        .sort()
        .join(',')
    : ''

for (const key of zhKeys) {
  if (!enKeys.has(key)) continue
  if (typeof zh[key] !== 'string' || typeof en[key] !== 'string') {
    problems.push(`值类型不一致: ${key}`)
    continue
  }
  if (!zh[key].trim() && !ALLOW_EMPTY.has(key)) problems.push(`中文为空: ${key}`)
  if (!en[key].trim() && !ALLOW_EMPTY.has(key)) problems.push(`英文为空: ${key}`)
  if (placeholders(zh[key]) !== placeholders(en[key])) {
    problems.push(
      `占位符不一致: ${key} (zh: ${placeholders(zh[key]) || '无'} / en: ${placeholders(en[key]) || '无'})`,
    )
  }
}

const total = zhKeys.size

if (problems.length) {
  console.error(`✗ i18n 校验失败，共 ${problems.length} 个问题（key 总数 ${total}）`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

const allowedEmpty = [...ALLOW_EMPTY].filter((key) => zhKeys.has(key)).length
console.log(
  `✓ i18n 校验通过：zh-CN / en-US 各 ${total} 个 key，占位符一致` +
    (allowedEmpty ? `，${allowedEmpty} 个 key 经白名单允许为空` : ''),
)
