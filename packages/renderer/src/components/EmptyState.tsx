import { Button } from '@heroui/react'
import type { ReactNode } from 'react'
import { SparklesIcon } from './Icons'

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
  <div className="app-surface flex flex-col items-start gap-3 rounded-lg p-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
      {icon ?? <SparklesIcon className="h-6 w-6" />}
    </div>
    <div>
      <p className="text-lg font-semibold text-[var(--ink-strong)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">{description}</p>
    </div>
    {actionLabel && onAction ? (
      <Button color="default" variant="flat" className="app-btn app-btn-primary" onPress={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
)

export default EmptyState
