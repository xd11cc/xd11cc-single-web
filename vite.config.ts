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
    resolve: {
      alias: {
        // @ 符号指向 src 目录
        '@': resolve(__dirname, 'src'),
        // @@ 符号指向 src/common 通用目录
        '@@': resolve(__dirname, 'src/common'),
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
        iconDir: [resolve(__dirname, 'src/assets/icons')],
        preserveColor: resolve(__dirname, 'src/assets/icons/preserve-color'),
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
