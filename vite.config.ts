import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { iconSubsetPlugin } from './vite/icon-subset'
import compression from 'vite-plugin-compression'
/**
 * 生成需要预构建的 Element Plus 依赖列表。
 *
 * 背景：unplugin-vue-components / unplugin-auto-import 是在「转换期」才注入
 * `element-plus/es/components/<x>/style/css` 这类 import 的，它们不参与 Vite 启动期的
 * 依赖扫描。于是第一次打开用到某个组件的页面（例如「授权应用配置」用 el-upload）时，
 * Vite 才把它们当「新依赖」去预构建，并强刷一次：
 *   ✨ new dependencies optimized: .../upload/style/css
 *   ✨ optimized dependencies changed. reloading
 * 这次重载会让正在加载的模块返回 504 (Outdated Optimize Dep)，
 * 动态 import 失败 → 路由启动失败 → index.html 里的 #app-loading 永远不被替换，
 * 表现就是「点某个页面后整个应用卡在 loading 页」。
 *
 * 这里把 Element Plus 全部组件样式目录一次性声明为预构建依赖：数量固定（百来个极小模块），
 * 换来的是「任何页面首次访问都不会再触发重新预构建」。比按用量推导更可靠——
 * 推导会漏掉 el-message / el-message-box 这类由 API 调用引入的样式。
 */
function elementPlusStyleDeps(): string[] {
  const componentsRoot = resolve(process.cwd(), 'node_modules/element-plus/es/components')
  let dirs: string[]
  try {
    dirs = readdirSync(componentsRoot)
  } catch {
    // 依赖尚未安装时跳过，不影响构建
    return []
  }

  const withStyle = dirs
    .filter((dir) => existsSync(resolve(componentsRoot, dir, 'style')))
    .sort()
    .map((dir) => `element-plus/es/components/${dir}/style/css`)

  // ElMessage / ElMessageBox / ElNotification / ElLoading 由 auto-import 注入，
  // 不属于任何标签，需要单独声明
  return ['element-plus/es', ...withStyle]
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv 返回的是 Record<string, string>（.env 里所有变量，不限 VITE_ 前缀），
  // 与 ImportMetaEnv 不是同一形状，不要硬转成它。这里只取用到的两个键。
  const { VITE_PUBLIC_PATH, VITE_WS_PATH } = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'prod'
  // PWA 离线缓存配置（仅生产环境注入）
  const pwaPlugin = isProd
    ? VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // 完整图标集合是「按需」chunk：不进预缓存清单，改为首次真正用到时再抓并缓存。
          // 否则 SW 安装阶段会把它整包下载，等于把入口拆出去又立刻搬回来。
          globIgnores: ['**/_virtual_icon-full-*.js'],
          runtimeCaching: [
            {
              urlPattern: /\/assets\/js\/_virtual_icon-full-.*\.js$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'iconify-full-icons',
                expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      })
    : null

  return {
    // 开发或打包构建时用到的公共基础路径
    base: VITE_PUBLIC_PATH,
    resolve: {
      alias: {
        // @ 符号指向 src 目录
        '@': resolve(__dirname, 'src'),
        // @@ 符号指向 src/common 通用目录
        '@@': resolve(__dirname, 'src/common'),
      },
    },
    // 开发环境配置
    server: {
      // 是否监听所有地址
      host: true,
      // 端口号
      port: 20001,
      // 端口被占用时，是否直接退出
      strictPort: false,
      // 是否自动打开浏览器
      open: true,
      // 反向代理：把后端接口与 Druid 控制台代理到同源，
      // 使开发环境与生产环境（同域部署）行为一致。
      // 注意 key 必须带前导斜杠，Vite 按字符串前缀匹配路径。
      proxy: {
        '/xd11cc': {
          target: 'http://127.0.0.1:10001',
          // 是否为 WebSocket
          ws: false,
          // 是否允许跨域：会把 Host 头改写为 target 的 host
          changeOrigin: true,
        },
        // WebSocket 服务（Netty，独立端口）
        [VITE_WS_PATH || '/ws']: {
          target: 'ws://127.0.0.1:10002',
          ws: true,
          changeOrigin: true,
        },
      },
      // 是否允许跨域
      cors: true,
      // 预热常用文件，提高初始页面加载速度
      warmup: {
        clientFiles: ['./src/layouts/**/*.*', './src/pinia/**/*.*', './src/router/**/*.*'],
      },
    },
    // 生产环境构建配置
    build: {
      // chunk 大小预警阈值（KB）
      chunkSizeWarningLimit: 500,
      // sourcemap：生产用 hidden 保留错误定位但不暴露完整源码
      sourcemap: isProd ? 'hidden' : 'inline',
      // rollup 输出配置
      rollupOptions: {
        output: {
          // 手动分包：只把「稳定的第三方」独立出来，避免主 chunk 过大。
          //
          // ⚠️ 不要把 element-plus 写进这里。manualChunks 的数组/对象写法会把列出的包
          // 当作 chunk 入口，而 Rollup 对 chunk 入口的导出不做 tree-shaking；
          // element-plus/es/index.mjs 是 re-export 全部组件与 hooks 的 barrel，
          // 一旦成为 chunk 入口就会把 91 个组件整包保留（实测首屏 273KB → 500KB gzip，
          // 源码根本没引用的 tour / cascader / table-v2 / color-picker 全被打进去）。
          // 改成函数式写法同样无效，必须完全不干预 EP 的分包，交给 Rollup 按需处理。
          // 验证：pnpm size（会断言入口不含 element-plus-*.js）
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            echarts: ['echarts', 'vue-echarts'],
          },
          // chunk 命名
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    optimizeDeps: {
      // 见 elementPlusStyleDeps() 的说明
      include: elementPlusStyleDeps(),
    },
    css: {
      // 线程中运行 CSS 预处理器
      preprocessorMaxWorkers: true,
      // 断点 mixin 不做全局注入：additionalData 属于「隐式依赖」，
      // 文件里看不出 mobile/sm 从哪来，且只要某次编译没带上注入（配置重建窗口、
      // 直接用 sass CLI 或 IDE 编译）就会报 Undefined mixin。
      // 现在需要断点的文件各自 @use '../.../breakpoints.scss' as *;，任何工具都能编译。
    },
    plugins: [
      // 图标按需加载：构建期只挑源码里用到的图标；运行时遇到未知图标再懒加载全量集合
      iconSubsetPlugin(),
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'types/auto/auto-imports.d.ts',
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        dts: 'types/auto/components.d.ts',
        resolvers: [
          // <el-table-column> 统一走本地透明包装，普通文本列自动开启 show-overflow-tooltip，
          // 业务模板无需逐列配置，也不用改任何页面文件
          (name: string) => {
            if (name === 'ElTableColumn') {
              return { from: '@@/components/TableColumn' }
            }
          },
          ElementPlusResolver(),
        ],
      }),
      // gzip 压缩：生产构建时生成 .gz 产物（Nginx 开启 gzip_static 直接返回）
      compression({
        algorithm: 'gzip',
        threshold: 1024, // 大于 1KB 才压缩
        ext: '.gz',
      }),
      // PWA 离线缓存支持（可选，生产构建时自动生成 Service Worker）
      ...(pwaPlugin ? [pwaPlugin] : []),
    ],
  }
})
