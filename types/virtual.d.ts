/**
 * Vite 虚拟模块的类型声明（由 vite/icon-subset.ts 在构建期生成）。
 *
 * 注意：本文件不能有顶层 import，否则 `declare module` 会变成「模块增强」
 * 而不是「环境模块声明」，未安装的虚拟模块名就解析不到。
 */
declare module 'virtual:icon-subset' {
  const collections: import('@iconify/vue').IconifyJSON[]
  export default collections
}

declare module 'virtual:icon-names' {
  /** 全部 lucide 图标名（含前缀），供图标选择器列表使用 */
  export const lucideNames: string[]
  /** 全部 ep 图标名（含前缀） */
  export const epNames: string[]
}

// 每个前缀一个独立 chunk：后端用到 lucide 菜单图标时不会顺带下载 ep
declare module 'virtual:icon-full-lucide' {
  const collection: import('@iconify/vue').IconifyJSON
  export default collection
}

declare module 'virtual:icon-full-ep' {
  const collection: import('@iconify/vue').IconifyJSON
  export default collection
}
