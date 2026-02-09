import { Button, Separator } from '@heroui/react'
import type { ReactElement, SVGProps } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from './api/service'
import type { User as UserProfile } from './api/generated/types.gen'
import LoadingScreen from './components/LoadingScreen'
import AgentPage from './pages/AgentPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import SchedulePage from './pages/SchedulePage'
import SettingsPage from './pages/SettingsPage'
import TodosPage from './pages/TodosPage'
import ThemeToggle from './components/ThemeToggle'
import {
  BotIcon,
  CalendarIcon,
  DashboardIcon,
  SettingsIcon,
  TodoIcon,
} from './components/Icons'

type PageKey = 'dashboard' | 'todos' | 'schedule' | 'agent' | 'settings'

type NavItem = {
  key: PageKey
  label: string
  description: string
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: '概览', description: '今日重点', Icon: DashboardIcon },
  { key: 'todos', label: 'Todo', description: '任务清单', Icon: TodoIcon },
  { key: 'schedule', label: '日程', description: '时间视图', Icon: CalendarIcon },
  { key: 'agent', label: 'AI 助手', description: '智能规划', Icon: BotIcon },
  { key: 'settings', label: '设置', description: '账户与系统', Icon: SettingsIcon },
]

const App = () => {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<'loading' | 'guest' | 'ready'>(
    'loading',
  )
  const loadProfile = useCallback(async () => {
    setStatus('loading')

    const response = await api.profile()

    if (!response.ok) {
      setStatus('guest')
      return
    }

    setUser(response.data)
    setStatus('ready')
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile()
  }, [loadProfile])

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile)
    setStatus('ready')
  }

  const handleLogout = () => {
    setUser(null)
    setStatus('guest')
    setActivePage('dashboard')
  }

  const currentPage = useMemo(() => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />
      case 'todos':
        return <TodosPage />
      case 'schedule':
        return <SchedulePage />
      case 'agent':
        return <AgentPage />
      case 'settings':
        return user ? <SettingsPage user={user} onLogout={handleLogout} /> : null
      default:
        return null
    }
  }, [activePage, user])

  const userDisplayName = user?.name || 'Todo User'
  const userInitials = useMemo(() => {
    const source = user?.name || user?.email || 'TU'
    const parts = source
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean)
    if (parts.length === 0) {
      return 'TU'
    }
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
  }, [user])

  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (status === 'guest') {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto min-h-full max-w-6xl px-4 py-4">
        <div className="app-surface app-shell grid h-[calc(100dvh-32px)] overflow-hidden lg:grid-cols-[260px_1fr]">
          <aside className="app-shell-aside">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
                Todo AI
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="app-title text-2xl font-semibold text-[var(--ink-strong)]">
                  工作台
                </p>
                <ThemeToggle />
              </div>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2 lg:flex-col">
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.key}
                  variant="tertiary"
                  className="app-nav-item justify-start w-full p-[20px]"
                  data-active={activePage === item.key}
                  onPress={() => setActivePage(item.key)}
                >
                  <div className="flex items-center gap-3">
                    <item.Icon className="app-nav-icon h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="text-xs opacity-70">
                        {item.description}
                      </span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </aside>

          <main className="app-shell-main">
            <div className="app-shell-header">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
                  当前模块
                </p>
                <p className="app-title text-2xl font-semibold text-[var(--ink-strong)]">
                  {NAV_ITEMS.find((item) => item.key === activePage)?.label}
                </p>
              </div>
              {user ? (
                <div className="flex items-center gap-3 rounded-md bg-[var(--surface-muted)] px-3 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--ink-strong)]">
                    {userInitials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink-strong)]">
                      {userDisplayName}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {user.email}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="app-shell-content">
              <div key={activePage} className="fade-up">
                {currentPage}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
