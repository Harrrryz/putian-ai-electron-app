import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  User,
} from '@heroui/react'
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

type PageKey = 'dashboard' | 'todos' | 'schedule' | 'agent' | 'settings'

type NavItem = {
  key: PageKey
  label: string
  description: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: '概览', description: '今日重点' },
  { key: 'todos', label: 'Todo', description: '任务清单' },
  { key: 'schedule', label: '日程', description: '时间视图' },
  { key: 'agent', label: 'AI 助手', description: '智能规划' },
  { key: 'settings', label: '设置', description: '账户与系统' },
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

  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (status === 'guest') {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="app-surface flex shrink-0 flex-col gap-4 rounded-[32px] p-5 lg:w-64">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
              Todo AI
            </p>
            <p className="app-title text-2xl font-semibold text-[var(--ink-strong)]">
              工作台
            </p>
          </div>
          <Divider />
          <div className="flex flex-wrap gap-2 lg:flex-col">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.key}
                variant={activePage === item.key ? 'solid' : 'light'}
                color={activePage === item.key ? 'success' : 'default'}
                className="justify-start"
                onPress={() => setActivePage(item.key)}
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold">
                    {item.label}
                  </span>
                  <span className="text-xs opacity-70">
                    {item.description}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <Card className="app-surface rounded-[32px]">
            <CardHeader className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
                  当前模块
                </p>
                <p className="app-title text-2xl font-semibold text-[var(--ink-strong)]">
                  {NAV_ITEMS.find((item) => item.key === activePage)?.label}
                </p>
              </div>
              {user ? (
                <User
                  name={user.name || 'Todo User'}
                  description={user.email}
                  avatarProps={{
                    radius: 'full',
                    color: 'success',
                    name: user.name || 'TU',
                  }}
                />
              ) : null}
            </CardHeader>
            <CardBody>{currentPage}</CardBody>
          </Card>
        </main>
      </div>
    </div>
  )
}

export default App
