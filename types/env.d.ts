interface ViteTypeOptions {
  /**
   * 让 import.meta.env 只认下面已声明的键。
   *
   * 不加这一行时 ImportMetaEnv 会 fallback 成 `Record<string, any>`，任何键名都合法——
   * `import.meta.env.NODE_ENV` 也正是这样溜过类型检查的（Vite 并不注入该键，
   * 运行时静默变成 undefined，参见 src/common/constants/cache-key.ts）。
   */
  strictImportMetaEnv: unknown
}

/**
 * 声明 vite 环境变量的类型。
 *
 * 注意：这里声明的键必须与 .env.* 及各 mode 的注入保持一致，
 * Vite 除了下列 VITE_ 开头的变量外，还会注入 BASE_URL / MODE / DEV / PROD / SSR（vite/client 已声明）。
 */
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_BASE_URL: string
  readonly VITE_ROUTER_HISTORY: 'hash' | 'html5'
  /** 前端静态资源与路由的 base 路径 */
  readonly VITE_PUBLIC_PATH: string
  /** 后端接口前缀（server.servlet.context-path） */
  readonly VITE_API_PREFIX: string
  readonly VITE_WS_URL: string
  readonly VITE_WS_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
