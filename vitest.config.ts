import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vitest/config'

/**
 * 单元测试配置（与 vite.config.ts 分开）。
 *
 * 不复用主配置的原因：主配置里有 PWA、压缩、i18n 构建期校验等只在打包时有意义的插件，
 * 带进测试只会拖慢启动。这里只保留 vue 插件 + 路径别名。
 */
export default defineConfig({
  plugins: [
    vue(),
    // 项目源码依赖自动导入（useDict / permission 等直接使用 ref、computed 而不 import），
    // 测试环境必须与生产一致，否则会报 “ref is not defined”。
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: false,
      // 与 vite.config.ts 保持一致：源码里 ElMessage / ref 等都是自动导入的
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@@': fileURLToPath(new URL('./src/common', import.meta.url)),
      types: fileURLToPath(new URL('./types', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    // Element Plus 的自动导入会带出 `.../style/css` 副作用导入，这些 .css 必须由 Vite 处理成空模块
    css: false,
    server: { deps: { inline: ['element-plus'] } },
    include: ['tests/**/*.spec.ts'],
    setupFiles: ['./tests/setup.ts'],
    // 组件里大量使用 <Icon>，测试中统一打桩，避免真的去加载图标数据
    restoreMocks: true,
  },
})
