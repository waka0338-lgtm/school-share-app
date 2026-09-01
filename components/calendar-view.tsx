'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  WEEKDAY_LABELS,
  MONTH_LABEL,
  buildCalendarCells,
  isBeforeCurrent,
  isAfterEnd,
  prevMonth,
  nextMonth,
  todayJST,
  formatDisplay,
} from '@/lib/dates'
import { CATEGORY_META, type ClassEvent } from '@/lib/types'
import { CategoryDot, CategoryBadge } from './category-badge'
import { EventDialog } from './event-dialog'

export function CalendarView({
  initialYear,
  initialMonth,
  events,
}: {
  initialYear: number
  initialMonth: number
  events: ClassEvent[]
}) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  // 日付をタップした時に開く「その日の一覧」シート
  const [sheetDate, setSheetDate] = useState<string | null>(null)
  // 予定の追加/編集フォーム
  const [formDate, setFormDate] = useState<string | null>(null)
  const [editing, setEditing] = useState<ClassEvent | null>(null)

  const cells = buildCalendarCells(year, month)
  const today = todayJST()

  const eventsByDate = new Map<string, ClassEvent[]>()
  for (const ev of events) {
    const arr = eventsByDate.get(ev.event_date) ?? []
    arr.push(ev)
    eventsByDate.set(ev.event_date, arr)
  }

  const prev = prevMonth(year, month)
  const next = nextMonth(year, month)
  const canPrev = !isBeforeCurrent(prev.year, prev.month)
  const canNext = !isAfterEnd(next.year, next.month)

  const sheetEvents = sheetDate ? (eventsByDate.get(sheetDate) ?? []) : []

  function goPrev() {
    if (!canPrev) return
    setYear(prev.year)
    setMonth(prev.month)
  }
  function goNext() {
    if (!canNext) return
    setYear(next.year)
    setMonth(next.month)
  }

  function openForm(date: string, ev: ClassEvent | null) {
    setSheetDate(null)
    setEditing(ev)
    setFormDate(date)
  }

  function closeForm() {
    setEditing(null)
    setFormDate(null)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-10 pt-5">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-card-foreground shadow-sm"
          aria-label="ホームに戻る"
        >
          <span className="text-xl">{'\u2039'}</span>
        </Link>
        <h1 className="text-xl font-black text-foreground">カレンダー</h1>
      </header>

      <section className="rounded-3xl bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canPrev}
            className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold text-card-foreground disabled:opacity-25"
            aria-label="前の月"
          >
            {'\u2039'}
          </button>
          <p className="text-lg font-black text-card-foreground">
            {MONTH_LABEL(year, month)}
          </p>
          <button
            type="button"
            onClick={goNext}
            disabled={!canNext}
            className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold text-card-foreground disabled:opacity-25"
            aria-label="次の月"
          >
            {'\u203a'}
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7">
          {WEEKDAY_LABELS.map((w, i) => (
            <div
              key={w}
              className={`py-1 text-center text-xs font-bold ${
                i === 0
                  ? 'text-event'
                  : i === 6
                    ? 'text-homework'
                    : 'text-muted-foreground'
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} />
            const dayNum = Number(date.split('-')[2])
            const dayEvents = eventsByDate.get(date) ?? []
            const isToday = date === today
            const isPast = date < today
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSheetDate(date)}
                className={`flex min-h-14 flex-col items-center gap-1 rounded-xl border p-1 transition active:scale-95 ${
                  isToday
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent bg-background'
                } ${isPast ? 'opacity-50' : ''}`}
              >
                <span
                  className={`text-sm font-bold ${
                    isToday ? 'text-primary' : 'text-card-foreground'
                  }`}
                >
                  {dayNum}
                </span>
                <span className="flex flex-wrap items-center justify-center gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <CategoryDot key={ev.id} category={ev.category} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl bg-card p-3 shadow-sm">
        {(['homework', 'submission', 'event'] as const).map((c) => (
          <div key={c} className="flex items-center gap-1.5">
            <CategoryDot category={c} />
            <span className="text-sm font-medium text-card-foreground">
              {CATEGORY_META[c].label}
            </span>
          </div>
        ))}
      </div>

      {/* 日付をタップ: その日の予定一覧 + 追加 */}
      {sheetDate && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onClick={() => setSheetDate(null)}
          role="dialog"
          aria-modal="true"
          aria-label="その日の予定"
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-card p-5 pb-8 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-card-foreground">
                {formatDisplay(sheetDate)}
              </h2>
              <button
                type="button"
                onClick={() => setSheetDate(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                aria-label="閉じる"
              >
                <span className="text-2xl leading-none">{'\u00d7'}</span>
              </button>
            </div>

            {sheetEvents.length > 0 && (
              <ul className="mb-4 flex flex-col gap-2">
                {sheetEvents.map((ev) => (
                  <li key={ev.id}>
                    <button
                      type="button"
                      onClick={() => openForm(ev.event_date, ev)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3 text-left"
                    >
                      <CategoryBadge category={ev.category} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-card-foreground">
                          {ev.title}
                        </p>
                        {ev.memo && (
                          <p className="truncate text-sm text-muted-foreground">
                            {ev.memo}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">編集</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => openForm(sheetDate, null)}
              className="min-h-12 w-full rounded-xl bg-primary px-4 font-bold text-primary-foreground"
            >
              ＋ この日に予定を追加
            </button>
          </div>
        </div>
      )}

      <EventDialog
        open={formDate !== null}
        onClose={closeForm}
        date={formDate ?? ''}
        existing={editing}
      />
    </main>
  )
}
