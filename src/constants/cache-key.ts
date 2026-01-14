const SYSTEM_NAME = import.meta.env.VITE_APP_TITLE

// 缓存时用到的key
export class CacheKey {
  static readonly TOKEN = `${SYSTEM_NAME}-token-key`
  static readonly CONFIG_LAYOUT = `${SYSTEM_NAME}-config-layout-key`
  static readonly SIDEBAR_STATUS = `${SYSTEM_NAME}-sidebar-status-key`
  static readonly VISITED_VIEW = `${SYSTEM_NAME}-visited-view-key`
  static readonly CACHED_VIEW = `${SYSTEM_NAME}-cached-view-key`
  static readonly ACTIVE_THEME_NAME = `${SYSTEM_NAME}-active-theme-name-key`
}
