/**
 * 头像配色：按用户 id 稳定取色。
 *
 * 聊天里所有头像原本都是「同一个浅色块 + 白色首字母」，亮色主题下白字叠在
 * `--el-color-primary-light-5`（#d1fae5）上对比度只有 1.13，字母几乎看不见。
 * 这里改成从语义色盘取色，并保证每个颜色与白字的对比度 ≥ 5.0。
 *
 * 用哈希而不是数组下标：同一个人在联系人列表、消息气泡、通知里颜色一致。
 */
const AVATAR_VARS = [
  'var(--theme-avatar-1)',
  'var(--theme-avatar-2)',
  'var(--theme-avatar-3)',
  'var(--theme-avatar-4)',
  'var(--theme-avatar-5)',
  'var(--theme-avatar-6)',
] as const

export function avatarColor(seed?: number | string | null): string {
  if (seed === undefined || seed === null) return AVATAR_VARS[0]
  const key = String(seed)
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000
  }
  return AVATAR_VARS[hash % AVATAR_VARS.length]
}

/** 取首字母作为头像文字，兼容中文/英文/空值 */
export function avatarText(name?: string | null): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return '?'
  return trimmed.charAt(0).toUpperCase()
}
