import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import SvgComponent from 'unplugin-svg-component/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_PUBLIC_PATH } = loadEnv(mode, process.cwd(), '') as ImportMetaEnv
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
      // 反向代理
      proxy: {
        xd11cc: {
          target: 'http://localhost:10001',
          // 是否为 WebSocket
          ws: false,
          // 是否允许跨域
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
    css: {
      // 线程中运行 CSS 预处理器
      preprocessorMaxWorkers: true,
    },
    plugins: [
      vue(),
      // 自动生成 SvgIcon 组件和 SVG 雪碧图
      SvgComponent({
        iconDir: [resolve(__dirname, 'src/common/assets/icons')],
        preserveColor: resolve(__dirname, 'src/common/assets/icons/preserve-color'),
        dts: true,
        dtsDir: resolve(__dirname, 'types/auto'),
      }),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'types/auto/auto-imports.d.ts',
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        dts: 'types/auto/components.d.ts',
        resolvers: [ElementPlusResolver()],
      }),
    ],
  }
})
