export type Category = 'homework' | 'submission' | 'event'

export interface ClassEvent {
  id: number
  title: string
  event_date: string // YYYY-MM-DD
  category: Category
  memo: string | null
  created_at: string
}

export const CATEGORY_META: Record<
  Category,
  { label: string; colorVar: string; fgVar: string; emojiFree: string }
> = {
  homework: {
    label: '宿題',
    colorVar: 'var(--homework)',
    fgVar: 'var(--homework-foreground)',
    emojiFree: '青',
  },
  submission: {
    label: '提出物',
    colorVar: 'var(--submission)',
    fgVar: 'var(--submission-foreground)',
    emojiFree: '緑',
  },
  event: {
    label: '行事',
    colorVar: 'var(--event)',
    fgVar: 'var(--event-foreground)',
    emojiFree: '赤',
  },
}

export const CATEGORY_ORDER: Category[] = ['homework', 'submission', 'event']
