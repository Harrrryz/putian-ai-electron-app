import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 className="app-title text-2xl font-semibold text-[var(--ink-strong)]">
        {title}
      </h1>
      {description ? (
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
  </div>
)

export default PageHeader
