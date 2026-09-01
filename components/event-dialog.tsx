'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  type Category,
  type ClassEvent,
} from '@/lib/types'
import { formatDisplay } from '@/lib/dates'
import { addEvent, updateEvent, deleteEvent } from '@/lib/actions'

interface Props {
  open: boolean
  onClose: () => void
  date: string
  existing?: ClassEvent | null
}

export function EventDialog({ open, onClose, date, existing }: Props) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('homework')
  const [memo, setMemo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle(existing?.title ?? '')
      setCategory(existing?.category ?? 'homework')
      setMemo(existing?.memo ?? '')
      setError(null)
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [open, existing])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        if (existing) {
          await updateEvent({
            id: existing.id,
            title,
            event_date: date,
            category,
            memo,
          })
        } else {
          await addEvent({ title, event_date: date, category, memo })
        }
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存に失敗しました')
      }
    })
  }

  function handleDelete() {
    if (!existing) return
    startTransition(async () => {
      try {
        await deleteEvent(existing.id)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : '削除に失敗しました')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={existing ? '予定を編集' : '予定を追加'}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-card p-5 pb-8 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-card-foreground">
            {existing ? '予定を編集' : '予定を追加'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="閉じる"
          >
            <span className="text-2xl leading-none">{'\u00d7'}</span>
          </button>
        </div>

        <p className="mb-4 text-sm font-medium text-muted-foreground">
          {formatDisplay(date)}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-card-foreground">分類</span>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_ORDER.map((c) => {
                const meta = CATEGORY_META[c]
                const active = category === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`flex min-h-11 items-center justify-center rounded-xl border-2 px-2 py-2 text-sm font-bold transition ${
                      active ? 'text-white' : 'text-card-foreground'
                    }`}
                    style={{
                      backgroundColor: active ? meta.colorVar : 'transparent',
                      borderColor: meta.colorVar,
                    }}
                    aria-pressed={active}
                  >
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-card-foreground">内容</span>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：算数プリント P.12"
              className="min-h-11 rounded-xl border border-border bg-background px-3 text-base outline-none focus:border-primary"
              maxLength={100}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-card-foreground">
              メモ（任意）
            </span>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="補足があれば入力"
              rows={2}
              className="rounded-xl border border-border bg-background px-3 py-2 text-base outline-none focus:border-primary"
              maxLength={300}
            />
          </label>

          {error && (
            <p className="rounded-lg bg-event/10 px-3 py-2 text-sm font-medium text-event">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            {existing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="min-h-12 flex-1 rounded-xl border-2 border-event px-4 font-bold text-event disabled:opacity-50"
              >
                削除
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="min-h-12 flex-[2] rounded-xl bg-primary px-4 font-bold text-primary-foreground disabled:opacity-50"
            >
              {isPending ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
