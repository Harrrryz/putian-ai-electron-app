import type { ReactNode, SVGProps } from 'react'

type IconBaseProps = SVGProps<SVGSVGElement> & {
  children: ReactNode
}

const IconBase = ({ children, className, ...props }: IconBaseProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
    {...props}
  >
    {children}
  </svg>
)

export type IconProps = SVGProps<SVGSVGElement>

export const DashboardIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="3" y="3.5" width="8" height="8" rx="2" />
    <rect x="13" y="3.5" width="8" height="8" rx="2" />
    <rect x="3" y="12.5" width="8" height="8" rx="2" />
    <rect x="13" y="12.5" width="8" height="8" rx="2" />
  </IconBase>
)

export const TodoIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M3.5 6.5l1.5 1.5 3-3" />
    <path d="M3.5 12l1.5 1.5 3-3" />
    <path d="M3.5 17.5l1.5 1.5 3-3" />
    <path d="M10 6.5h10" />
    <path d="M10 12h10" />
    <path d="M10 17.5h10" />
  </IconBase>
)

export const CalendarIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M3 9h18" />
  </IconBase>
)

export const BotIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="4" y="7" width="16" height="12" rx="4" />
    <path d="M12 7V4" />
    <circle cx="9" cy="13" r="1" />
    <circle cx="15" cy="13" r="1" />
    <path d="M8 17h8" />
  </IconBase>
)

export const SettingsIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
    <circle cx="9" cy="6" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="11" cy="18" r="2" />
  </IconBase>
)

export const SparklesIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 3v4" />
    <path d="M12 17v4" />
    <path d="M4.5 12h4" />
    <path d="M15.5 12h4" />
    <path d="M6.2 6.2l2.2 2.2" />
    <path d="M15.6 15.6l2.2 2.2" />
    <path d="M6.2 17.8l2.2-2.2" />
    <path d="M15.6 8.4l2.2-2.2" />
  </IconBase>
)
