import { CategoryBadge } from './category-badge'
import { formatDisplay } from '@/lib/dates'
import type { ClassEvent } from '@/lib/types'

export function TomorrowBanner({
  date,
  events,
}: {
  date: string
  events: ClassEvent[]
}) {
  return (
    <section
      className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-md"
      aria-label="次の日の予定"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold opacity-90">あすの予定</p>
        <p className="text-sm font-bold opacity-90">{formatDisplay(date)}</p>
      </div>

      {events.length === 0 ? (
        <p className="py-3 text-lg font-bold">あすの予定はありません</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="flex items-center gap-3 rounded-2xl bg-card/15 px-3 py-3 backdrop-blur"
            >
              <CategoryBadge category={ev.category} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold leading-tight">
                  {ev.title}
                </p>
                {ev.memo && (
                  <p className="truncate text-sm opacity-90">{ev.memo}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
