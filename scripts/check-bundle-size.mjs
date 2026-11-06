/**
 * 打包体积守门脚本（`pnpm size`）。
 *
 * 为什么需要它：`vite.config.ts` 的 manualChunks 一旦把 `element-plus` 列为
 * chunk 入口，Rollup 对 chunk 入口的导出不做 tree-shaking，会把 EP 全部 91 个
 * 组件整包保留——首屏从 273KB 涨到 500KB（gzip），而构建依然成功、类型检查
 * 依然通过、单元测试依然全绿。也就是说这是一个**没有任何自动化反馈**的回归点，
 * 只能靠体积断言兜住。
 *
 * 断言（任一失败即退出码 1）：
 *   1. 入口 HTML 不得引用 element-plus-*.js（说明 EP 又被整包保留了）；
 *   2. 产物中不得出现源码未引用的 EP 组件实现（抽样 key 组件）；
 *   3. 首屏（入口 + modulepreload 的 JS + 入口 CSS，gzip 后）不得超过预算。
 *
 * 预算值取切换后的实测值 + 约 10% 余量，只用于拦「成倍增长」，不拦日常波动。
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST = 'dist'
const BUDGET_FIRST_SCREEN_KB = 175
const BUDGET_ENTRY_KB = 115

/**
 * 只服务个别页面的重型依赖，不得出现在入口 chunk 里。
 * 这类东西一旦被全局注册（而不是随组件懒加载），构建、类型检查、单测都不会报错，
 * 只有这里能拦住。
 */
const MUST_BE_ABSENT_IN_ENTRY = [
  // highlight.js：只有 CodeBlock 用，应随它懒加载（见 src/plugins/hljs.ts）
  { marker: 'registerLanguage', label: 'highlight.js' },
]

/** 源码里没有被引用的 EP 组件：一旦在产物中出现，说明 EP 又被整包保留了 */
const MUST_BE_ABSENT = [
  'ElTour',
  'ElCascaderPanel',
  'ElTableV2',
  'ElColorPicker',
  'ElTransfer',
  'ElVirtualList',
  'ElMention',
  'ElAnchor',
  'ElSplitter',
  'ElCalendar',
  'ElImageViewer',
  'ElPageHeader',
  'ElInfiniteScroll',
]

const failures = []
const notes = []

function fail(msg) {
  failures.push(msg)
}

function kb(bytes) {
  return (bytes / 1024).toFixed(1)
}

if (!existsSync(DIST)) {
  console.error(`✗ 找不到 ${DIST}/，请先执行 pnpm build 或 vite build --mode prod`)
  process.exit(1)
}

// ── 1. 读取入口 HTML 的静态引用 ────────────────────────────────────────────
const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const entryJs = [...html.matchAll(/src="\/assets\/js\/([^"]+)"/g)].map((m) => m[1])
const preloadJs = [...html.matchAll(/modulepreload[^>]*href="\/assets\/js\/([^"]+)"/g)].map(
  (m) => m[1],
)
const entryCss = [...html.matchAll(/href="\/assets\/css\/([^"]+)"/g)].map((m) => m[1])

if (entryJs.length === 0) fail('入口 HTML 里找不到 <script type="module"> 引用')

// ── 2. 断言：入口不得引用 element-plus-*.js ───────────────────────────────
const forbiddenEntry = [...entryJs, ...preloadJs].filter((f) => /^element-plus-/.test(f))
if (forbiddenEntry.length > 0) {
  fail(
    `入口引用了 ${forbiddenEntry.join(', ')}：` +
      '说明 manualChunks 又把 element-plus 当成了 chunk 入口（见 vite.config.ts 注释），' +
      'EP 会被整包保留。',
  )
}

// ── 3. 断言：只服务个别页面的重型依赖不得进入入口 chunk ──────────────────
const entryTexts = entryJs.map((f) => {
  const p = join(DIST, 'assets/js', f)
  return existsSync(p) ? readFileSync(p, 'utf8') : ''
})
for (const { marker, label } of MUST_BE_ABSENT_IN_ENTRY) {
  if (entryTexts.some((t) => t.includes(marker))) {
    fail(
      `入口 chunk 里出现了 ${label}（标记 “${marker}”）：` +
        '说明它又被全局注册了，应改为随使用它的组件懒加载。',
    )
  }
}

// ── 4. 断言：产物中不得出现未引用的 EP 组件实现 ───────────────────────────
const jsDir = join(DIST, 'assets/js')
const allJs = existsSync(jsDir) ? readdirSync(jsDir).filter((f) => extname(f) === '.js') : []
if (allJs.length === 0) fail(`在 ${jsDir} 下没有找到任何 JS 产物`)

const bundled = new Set()
for (const f of allJs) {
  const text = readFileSync(join(jsDir, f), 'utf8')
  for (const name of MUST_BE_ABSENT) {
    if (bundled.has(name)) continue
    if (text.includes(name)) bundled.add(name)
  }
}
if (bundled.size > 0) {
  fail(
    `产物中出现了源码未引用的 EP 组件：${[...bundled].join(', ')}。` +
      '通常是 manualChunks 把 element-plus 整包固定进了某个 chunk。',
  )
}

// ── 5. 首屏体积统计 ───────────────────────────────────────────────────────
function gzipSize(rel) {
  const p = join(DIST, rel)
  return existsSync(p) ? gzipSync(readFileSync(p)).length : 0
}

const firstScreenFiles = [
  ...entryJs.map((f) => `assets/js/${f}`),
  ...preloadJs.map((f) => `assets/js/${f}`),
  ...entryCss.map((f) => `assets/css/${f}`),
]
let firstScreen = 0
const perFile = []
for (const rel of firstScreenFiles) {
  const gz = gzipSize(rel)
  firstScreen += gz
  perFile.push([rel, gz])
}

const entrySize = entryJs.reduce((s, f) => s + gzipSize(`assets/js/${f}`), 0)

if (firstScreen > BUDGET_FIRST_SCREEN_KB * 1024) {
  fail(
    `首屏 gzip ${kb(firstScreen)}KB 超出预算 ${BUDGET_FIRST_SCREEN_KB}KB` +
      `（入口+preload+CSS；若确为有意增长，请同步上调脚本里的预算值）`,
  )
}
if (entrySize > BUDGET_ENTRY_KB * 1024) {
  fail(
    `入口 chunk gzip ${kb(entrySize)}KB 超出预算 ${BUDGET_ENTRY_KB}KB` +
      '（注意不应把 echarts / bpmn 这类大依赖并入入口）',
  )
}

// ── 6. 报告 ───────────────────────────────────────────────────────────────
console.log('打包体积检查')
console.log(`  产物 JS 文件数：${allJs.length}`)

const rawJs = allJs.reduce((s, f) => s + statSync(join(jsDir, f)).size, 0)
console.log(
  `  产物 JS 原始总量：${kb(rawJs)}KB（gzip 后 ${kb(allJs.reduce((s, f) => s + gzipSize(`assets/js/${f}`), 0))}KB）`,
)
console.log('  首屏静态引用：')
for (const [rel, gz] of perFile.sort((a, b) => b[1] - a[1])) {
  console.log(`    ${kb(gz).padStart(8)}KB  ${rel}`)
}
console.log(
  `  首屏合计：${kb(firstScreen)}KB gzip（预算 ${BUDGET_FIRST_SCREEN_KB}KB） / 入口 ${kb(entrySize)}KB（预算 ${BUDGET_ENTRY_KB}KB）`,
)

if (notes.length) notes.forEach((n) => console.log(`  提示：${n}`))

if (failures.length > 0) {
  console.error('')
  failures.forEach((f) => console.error(`✗ ${f}`))
  process.exit(1)
}
console.log('')
console.log('✓ 体积守门通过')
