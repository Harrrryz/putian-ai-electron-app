import { Spinner } from '@heroui/react'

type LoadingScreenProps = {
  label?: string
}

const LoadingScreen = ({ label = '正在加载应用...' }: LoadingScreenProps) => (
  <div className="flex min-h-full items-center justify-center">
    <div className="app-surface flex flex-col items-center gap-4 rounded-3xl px-8 py-10 text-center">
      <Spinner size="lg" color="success" />
      <p className="text-sm text-[var(--ink-soft)]">{label}</p>
    </div>
  </div>
)

export default LoadingScreen
