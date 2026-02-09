import { Card, Chip, Spinner } from '@heroui/react'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/service'
import type { TodoModel, UsageStatsResponse } from '../api/generated/types.gen'
import PageHeader from '../components/PageHeader'
import { formatDateTime } from '../utils/datetime'

const DashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<UsageStatsResponse | null>(null)
  const [stats, setStats] = useState({ total: 0, upcoming: 0, high: 0 })
  const [upcomingTodos, setUpcomingTodos] = useState<TodoModel[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [todoResponse, usageResponse] = await Promise.all([
      api.listTodos({ pageSize: 200 }),
      api.getUsageStats(),
    ])

    if (!todoResponse.ok) {
      setError(todoResponse.error)
      setLoading(false)
      return
    }

    if (!usageResponse.ok) {
      setError(usageResponse.error)
      setLoading(false)
      return
    }

    const items = todoResponse.data.items ?? []
    const now = Date.now()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    const inSevenDays = now + 7 * 24 * 60 * 60 * 1000

    const upcoming = items.filter((todo) => {
      const start = new Date(todo.start_time).getTime()
      return !Number.isNaN(start) && start >= now && start <= inSevenDays
    })

    const upcomingToday = items.filter((todo) => {
      const start = new Date(todo.start_time).getTime()
      return (
        !Number.isNaN(start) &&
        start >= now &&
        start >= startOfToday.getTime() &&
        start <= endOfToday.getTime()
      )
    })

    const highImportance = items.filter((todo) => todo.importance === 'high')

    setStats({
      total: items.length,
      upcoming: upcoming.length,
      high: highImportance.length,
    })
    setUpcomingTodos(
      [...upcomingToday]
        .sort(
          (a, b) =>
            new Date(a.start_time).getTime() -
            new Date(b.start_time).getTime(),
        )
        .slice(0, 4),
    )
    setUsage(usageResponse.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-surface rounded-md px-5 py-6 text-sm text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="概览"
        description="掌握你的任务节奏与 AI 使用情况。"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="app-surface app-card rounded-lg">
          <Card.Header className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
            任务总数
          </Card.Header>
          <Card.Content className="app-card-body text-3xl font-semibold text-[var(--ink-strong)]">
            {stats.total}
          </Card.Content>
        </Card>
        <Card className="app-surface app-card rounded-lg">
          <Card.Header className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
            未来 7 天
          </Card.Header>
          <Card.Content className="app-card-body text-3xl font-semibold text-[var(--ink-strong)]">
            {stats.upcoming}
          </Card.Content>
        </Card>
        <Card className="app-surface app-card rounded-lg">
          <Card.Header className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
            高优先级
          </Card.Header>
          <Card.Content className="app-card-body text-3xl font-semibold text-[var(--ink-strong)]">
            {stats.high}
          </Card.Content>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="app-surface app-card rounded-lg">
          <Card.Header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                即将开始
              </p>
              <p className="text-lg font-semibold text-[var(--ink-strong)]">
                下一步安排
              </p>
            </div>
          </Card.Header>
          <Card.Content className="app-card-body space-y-3">
            {upcomingTodos.length ? (
              upcomingTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="rounded-md border border-[var(--surface-border)] bg-[var(--surface-muted)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-[var(--ink-strong)]">
                      {todo.item}
                    </p>
                    <Chip
                      size="sm"
                      variant="secondary"
                      color="default"
                      className="app-chip"
                    >
                      {todo.importance}
                    </Chip>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {formatDateTime(todo.start_time)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--ink-soft)]">
                暂无即将开始的任务。
              </p>
            )}
          </Card.Content>
        </Card>

        <Card className="app-surface app-card rounded-lg">
          <Card.Header className="flex flex-col items-start gap-1">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
              AI 用量
            </p>
            <p className="text-lg font-semibold text-[var(--ink-strong)]">
              本月使用情况
            </p>
          </Card.Header>
          <Card.Content className="app-card-body space-y-3 text-sm text-[var(--ink-soft)]">
            {usage ? (
              <>
                <div className="flex items-center justify-between">
                  <span>已使用</span>
                  <span className="font-semibold text-[var(--ink-strong)]">
                    {usage.usage_count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>剩余额度</span>
                  <span className="font-semibold text-[var(--ink-strong)]">
                    {usage.remaining_quota}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>重置时间</span>
                  <span className="font-semibold text-[var(--ink-strong)]">
                    {formatDateTime(usage.reset_date)}
                  </span>
                </div>
              </>
            ) : (
              <p>暂无用量信息。</p>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
