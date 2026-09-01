import Link from 'next/link'
import { getEvents, getPhotoUrl } from '@/lib/actions'
import { tomorrowJST, MONTH_LABEL, currentYearMonth } from '@/lib/dates'
import { CATEGORY_ORDER } from '@/lib/types'
import { ClassPhoto } from '@/components/class-photo'
import { TomorrowBanner } from '@/components/tomorrow-banner'
import { CategorySection } from '@/components/category-section'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [events, photoUrl] = await Promise.all([getEvents(), getPhotoUrl()])
  const tomorrow = tomorrowJST()
  const tomorrowEvents = events.filter((e) => e.event_date === tomorrow)
  const { year, month } = currentYearMonth()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-black text-foreground">クラスの予定表</h1>
        <span className="text-sm font-bold text-muted-foreground">
          {MONTH_LABEL(year, month)}
        </span>
      </header>

      <ClassPhoto photoUrl={photoUrl} />

      <TomorrowBanner date={tomorrow} events={tomorrowEvents} />

      <Link
        href="/calendar"
        className="flex min-h-24 items-center justify-between rounded-3xl bg-foreground p-5 text-background shadow-md transition active:scale-[0.99]"
      >
        <div>
          <p className="text-xs font-bold opacity-70">タップして予定を追加</p>
          <p className="mt-1 text-2xl font-black">カレンダーを開く</p>
        </div>
        <span className="text-3xl" aria-hidden="true">
          {'\u{1F4C5}'}
        </span>
      </Link>

      <div className="grid grid-cols-1 gap-3">
        {CATEGORY_ORDER.map((c) => (
          <CategorySection key={c} category={c} events={events} />
        ))}
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground text-pretty">
        だれでも自由に予定を追加・編集できます。先月の予定は自動で消えます。
      </p>
    </main>
  )
}
