/**
 * 声明 vite 环境变量的类型（如果未声明则默认是 any）
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
