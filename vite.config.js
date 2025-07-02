import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { viteMockServe } from 'vite-plugin-mock'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
      symbolId: 'icon-[dir]-[name]',
    }),
    viteMockServe({
      mockPath: 'mock', // mock数据存放目录
      localEnabled: true, // 开发环境启用
      prodEnabled: false, // 生产环境是否启用
    }),
    viteCompression({
      verbose: true, // 是否在控制台输出压缩的结果
      threshold: 10240, // 单位/kb，当文件大于多少时才会压缩
      algorithm: 'gzip', // 压缩算法
      ext: '.gz', // 压缩后的文件后缀
      deleteOriginFile: false, // 是否删除源文件
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/style/index.css";`,
      },
    },
  },
})
