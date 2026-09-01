// カレンダーは 2027年4月まで。月は日本時間(JST)基準で判定する。
export const CALENDAR_END = { year: 2027, month: 4 } // 2027年4月まで表示

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']
const MONTH_LABEL = (y: number, m: number) => `${y}年${m}月`

export { WEEKDAY_LABELS, MONTH_LABEL }

/** 日本時間での「今日」を YYYY-MM-DD で返す */
export function todayJST(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return parts // en-CA -> YYYY-MM-DD
}

export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

/** 現在の年月(JST) */
export function currentYearMonth(): { year: number; month: number } {
  const t = todayJST()
  const [y, m] = t.split('-').map(Number)
  return { year: y, month: m }
}

/** その月の日数 */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** その月の1日の曜日 (0=日 .. 6=土) */
export function firstWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
}

/** カレンダーグリッド用: 先頭の空白 + 日付配列 */
export function buildCalendarCells(
  year: number,
  month: number,
): (string | null)[] {
  const total = daysInMonth(year, month)
  const lead = firstWeekday(year, month)
  const cells: (string | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(ymd(year, month, d))
  return cells
}

/** 月の移動可否 */
export function isBeforeCurrent(year: number, month: number): boolean {
  const c = currentYearMonth()
  return year < c.year || (year === c.year && month < c.month)
}

export function isAfterEnd(year: number, month: number): boolean {
  return (
    year > CALENDAR_END.year ||
    (year === CALENDAR_END.year && month > CALENDAR_END.month)
  )
}

export function prevMonth(year: number, month: number) {
  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 }
}

export function nextMonth(year: number, month: number) {
  return month === 12
    ? { year: year + 1, month: 1 }
    : { year, month: month + 1 }
}

/** 「次の日」= 明日 の YYYY-MM-DD (JST) */
export function tomorrowJST(): string {
  const t = todayJST()
  const [y, m, d] = t.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  return ymd(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate())
}

/** 表示用: YYYY-MM-DD -> M月D日(曜) */
export function formatDisplay(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return `${m}月${d}日(${WEEKDAY_LABELS[wd]})`
}

/** 今日からの残り日数 (負なら過去) */
export function daysUntil(date: string): number {
  const [ty, tm, td] = todayJST().split('-').map(Number)
  const [y, m, d] = date.split('-').map(Number)
  const a = Date.UTC(ty, tm - 1, td)
  const b = Date.UTC(y, m - 1, d)
  return Math.round((b - a) / 86400000)
}
