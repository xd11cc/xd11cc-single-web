const SYSTEM_NAME = import.meta.env.VITE_APP_TITLE
const ENV = import.meta.env.NODE_ENV

// 缓存时用到的key
export class CacheKey {
  static readonly TOKEN = `${SYSTEM_NAME}-${ENV}-token-key`
  static readonly THEME = `${SYSTEM_NAME}-${ENV}-theme-key`
  static readonly CONFIG_LAYOUT = `${SYSTEM_NAME}-${ENV}-config-layout-key`
  static readonly SIDEBAR_STATUS = `${SYSTEM_NAME}-${ENV}-sidebar-status-key`
  static readonly VISITED_VIEW = `${SYSTEM_NAME}-${ENV}-visited-view-key`
  static readonly CACHED_VIEW = `${SYSTEM_NAME}-${ENV}-cached-view-key`
  static readonly OSS_URL = `${SYSTEM_NAME}-${ENV}-oss-url-key`
  static readonly TABLE_COLUMNS = `${SYSTEM_NAME}-${ENV}-table-columns`
}
