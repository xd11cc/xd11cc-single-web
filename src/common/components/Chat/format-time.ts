/**
 * 聊天时间格式化。
 *
 * 列表里只看「最近一条是什么时候」，消息流里需要「这条是哪天、几点」。
 * 两者规则不同，所以分开导出，避免在一个 formatTime 里塞分支。
 */

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

/** 时:分，固定两位（表格里对齐用 tabular-nums） */
export function formatClock(timestamp?: number): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** 自然日序号，用于判断「是否同一天 / 是否昨天」 */
function dayIndex(timestamp: number): number {
  const date = new Date(timestamp)
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY)
}

export type DayLabel = { today: string; yesterday: string }

/**
 * 消息流里的日期分隔线文案：
 * 今天 / 昨天 / M月D日（跨年时带年份）
 */
export function formatDayLabel(timestamp: number, label: DayLabel): string {
  const diff = dayIndex(Date.now()) - dayIndex(timestamp)
  if (diff === 0) return label.today
  if (diff === 1) return label.yesterday
  const date = new Date(timestamp)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return sameYear ? `${month}月${day}日` : `${date.getFullYear()}年${month}月${day}日`
}

/** 联系人列表右侧的时间：今天显示时刻，昨天显示「昨天」，更早显示月-日 */
export function formatListTime(timestamp: number | undefined, yesterday: string): string {
  if (!timestamp) return ''
  const diff = dayIndex(Date.now()) - dayIndex(timestamp)
  if (diff === 0) return formatClock(timestamp)
  if (diff === 1) return yesterday
  const date = new Date(timestamp)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** 同一个人连续发言、且间隔小于 5 分钟，合并成一组（不重复显示名字和时间） */
export function shouldGroupWithPrev(
  prev: { senderId: number; timestamp: number } | null,
  current: { senderId: number; timestamp: number },
): boolean {
  if (!prev) return false
  return prev.senderId === current.senderId && current.timestamp - prev.timestamp < 5 * MINUTE
}
