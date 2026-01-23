import { Button } from '@heroui/react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) => (
  <div className="app-surface flex flex-col items-start gap-3 rounded-3xl p-6">
    <div className="text-3xl">{icon ?? '✨'}</div>
    <div>
      <p className="text-lg font-semibold text-[var(--ink-strong)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">{description}</p>
    </div>
    {actionLabel && onAction ? (
      <Button color="success" onPress={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
)

export default EmptyState
