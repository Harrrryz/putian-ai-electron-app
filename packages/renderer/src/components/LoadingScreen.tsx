import { Spinner } from '@heroui/react'

type LoadingScreenProps = {
  label?: string
}

const LoadingScreen = ({ label = '正在加载应用...' }: LoadingScreenProps) => (
  <div className="flex min-h-full items-center justify-center">
    <div className="app-surface flex flex-col items-center gap-3 rounded-lg px-6 py-8 text-center">
      <Spinner size="lg" />
      <p className="text-sm text-[var(--ink-soft)]">{label}</p>
    </div>
  </div>
)

export default LoadingScreen
