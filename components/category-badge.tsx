import { CATEGORY_META, type Category } from '@/lib/types'

export function CategoryBadge({
  category,
  size = 'md',
}: {
  category: Category
  size?: 'sm' | 'md'
}) {
  const meta = CATEGORY_META[category]
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{ backgroundColor: meta.colorVar, color: meta.fgVar }}
    >
      {meta.label}
    </span>
  )
}

export function CategoryDot({ category }: { category: Category }) {
  const meta = CATEGORY_META[category]
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: meta.colorVar }}
      aria-hidden="true"
    />
  )
}
