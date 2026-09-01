'use client'

import { useState } from 'react'
import { CATEGORY_META, type Category, type ClassEvent } from '@/lib/types'
import { formatDisplay, daysUntil } from '@/lib/dates'
import { EventDialog } from './event-dialog'

function untilLabel(date: string): string {
  const d = daysUntil(date)
  if (d === 0) return 'きょう'
  if (d === 1) return 'あした'
  if (d > 0) return `あと${d}日`
  return `${-d}日前`
}

export function CategorySection({
  category,
  events,
}: {
  category: Category
  events: ClassEvent[]
}) {
  const meta = CATEGORY_META[category]
  const [editing, setEditing] = useState<ClassEvent | null>(null)
  const list = events
    .filter((e) => e.category === category)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))

  return (
    <section className="rounded-3xl bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-block h-4 w-4 rounded-full"
          style={{ backgroundColor: meta.colorVar }}
          aria-hidden="true"
        />
        <h2 className="text-base font-bold text-card-foreground">
          {meta.label}
        </h2>
        <span className="ml-auto text-sm font-medium text-muted-foreground">
          {list.length}件
        </span>
      </div>

      {list.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          予定はありません
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((ev) => (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => setEditing(ev)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3 text-left transition active:scale-[0.99]"
              >
                <div
                  className="flex min-h-11 w-1 self-stretch rounded-full"
                  style={{ backgroundColor: meta.colorVar }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-card-foreground">
                    {ev.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDisplay(ev.event_date)}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{
                    backgroundColor: meta.colorVar,
                    color: meta.fgVar,
                  }}
                >
                  {untilLabel(ev.event_date)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <EventDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        date={editing?.event_date ?? ''}
        existing={editing}
      />
    </section>
  )
}
