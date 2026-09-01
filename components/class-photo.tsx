'use client'

import { useRef, useState, useTransition } from 'react'
import { updatePhoto } from '@/lib/actions'

export function ClassPhoto({ photoUrl }: { photoUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    startTransition(async () => {
      try {
        await updatePhoto(formData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
      }
    })
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-muted shadow-sm">
      <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl || '/placeholder.svg'}
            alt="学級の写真"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
            <span className="text-4xl" aria-hidden="true">
              {'\u{1F4F7}'}
            </span>
            <p className="text-sm font-medium">学級の写真を追加できます</p>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="absolute bottom-3 right-3 flex min-h-11 items-center gap-1.5 rounded-full bg-card/95 px-4 py-2 text-sm font-bold text-card-foreground shadow-md backdrop-blur disabled:opacity-60"
        >
          {isPending ? 'アップロード中...' : '写真を変更'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {error && (
        <p className="bg-event/10 px-4 py-2 text-sm font-medium text-event">
          {error}
        </p>
      )}
    </section>
  )
}
