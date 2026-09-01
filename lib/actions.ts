'use server'

import { revalidatePath } from 'next/cache'
import { put, del } from '@vercel/blob'
import { sql } from './db'
import type { Category, ClassEvent } from './types'
import { currentYearMonth, ymd } from './dates'

/** 前月以前のデータを削除する。月が更新されると前月のデータは消える。 */
async function purgeOldEvents() {
  const { year, month } = currentYearMonth()
  const firstOfThisMonth = ymd(year, month, 1)
  await sql`DELETE FROM events WHERE event_date < ${firstOfThisMonth}`
}

export async function getEvents(): Promise<ClassEvent[]> {
  await purgeOldEvents()
  const rows = await sql`
    SELECT id, title, to_char(event_date, 'YYYY-MM-DD') AS event_date,
           category, memo, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
    FROM events
    ORDER BY event_date ASC, id ASC
  `
  return rows as ClassEvent[]
}

export async function addEvent(input: {
  title: string
  event_date: string
  category: Category
  memo?: string
}) {
  const title = input.title.trim()
  if (!title) throw new Error('タイトルを入力してください')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.event_date)) {
    throw new Error('日付が正しくありません')
  }
  if (!['homework', 'submission', 'event'].includes(input.category)) {
    throw new Error('分類が正しくありません')
  }
  const memo = input.memo?.trim() || null
  await sql`
    INSERT INTO events (title, event_date, category, memo)
    VALUES (${title}, ${input.event_date}, ${input.category}, ${memo})
  `
  revalidatePath('/')
  revalidatePath('/calendar')
}

export async function updateEvent(input: {
  id: number
  title: string
  event_date: string
  category: Category
  memo?: string
}) {
  const title = input.title.trim()
  if (!title) throw new Error('タイトルを入力してください')
  const memo = input.memo?.trim() || null
  await sql`
    UPDATE events
    SET title = ${title}, event_date = ${input.event_date},
        category = ${input.category}, memo = ${memo}
    WHERE id = ${input.id}
  `
  revalidatePath('/')
  revalidatePath('/calendar')
}

export async function deleteEvent(id: number) {
  await sql`DELETE FROM events WHERE id = ${id}`
  revalidatePath('/')
  revalidatePath('/calendar')
}

export async function getPhotoUrl(): Promise<string | null> {
  const rows = (await sql`SELECT photo_url FROM settings WHERE id = 1`) as {
    photo_url: string | null
  }[]
  return rows[0]?.photo_url ?? null
}

export async function updatePhoto(formData: FormData): Promise<void> {
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('画像が選択されていません')
  if (!file.type.startsWith('image/')) {
    throw new Error('画像ファイルを選んでください')
  }

  // 既存の写真を削除
  const existing = await getPhotoUrl()
  if (existing) {
    try {
      await del(existing)
    } catch {
      // 失敗しても続行
    }
  }

  const blob = await put(`class-photo-${Date.now()}-${file.name}`, file, {
    access: 'public',
  })

  await sql`
    INSERT INTO settings (id, photo_url, updated_at)
    VALUES (1, ${blob.url}, now())
    ON CONFLICT (id) DO UPDATE SET photo_url = ${blob.url}, updated_at = now()
  `
  revalidatePath('/')
}
