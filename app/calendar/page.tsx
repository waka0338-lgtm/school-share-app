import { getEvents } from '@/lib/actions'
import { currentYearMonth } from '@/lib/dates'
import { CalendarView } from '@/components/calendar-view'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const events = await getEvents()
  const { year, month } = currentYearMonth()

  return (
    <CalendarView initialYear={year} initialMonth={month} events={events} />
  )
}
