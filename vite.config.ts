import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import compression from 'vite-plugin-compression'
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_PUBLIC_PATH, VITE_WS_PATH } = loadEnv(mode, process.cwd(), '') as ImportMetaEnv
  const isProd = mode === 'prod'
  // PWA 离线缓存配置（仅生产环境注入）
  const pwaPlugin = isProd
    ? VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
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
          target: 'ws://127.0.0.1:12001',
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
          // 手动分包：vendor 与 Element Plus 独立，避免主 chunk 过大
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            'element-plus': ['element-plus'],
            echarts: ['echarts', 'vue-echarts'],
          },
          // chunk 命名
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    css: {
      // 线程中运行 CSS 预处理器
      preprocessorMaxWorkers: true,
      preprocessorOptions: {
        scss: {
          // 断点 mixin 全局注入。
          // 只注入变量与 mixin 定义、不产出任何 CSS，所以不会重复打包。
          // 之前 breakpoints.scss 只在 index.scss 里 @use，Sass 模块作用域不外溢，
          // 结果就是全站 0 次调用、11 种手写断点各写各的。
          additionalData: `@use '@@/assets/styles/breakpoints.scss' as *;\n`,
        },
      },
    },
    plugins: [
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
