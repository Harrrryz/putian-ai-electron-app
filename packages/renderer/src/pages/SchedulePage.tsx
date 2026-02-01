import { Button, Card, CardBody, CardHeader, Input, Spinner } from '@heroui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/service'
import type { TodoModel } from '../api/generated/types.gen'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { formatDateTime, formatDateOnly } from '../utils/datetime'

const toRangeIso = (dateValue: string, endOfDay = false) => {
  if (!dateValue) {
    return undefined
  }
  const suffix = endOfDay ? 'T23:59:59' : 'T00:00:00'
  const date = new Date(`${dateValue}${suffix}`)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const SchedulePage = () => {
  const today = new Date()
  const [rangeStart, setRangeStart] = useState(
    today.toISOString().slice(0, 10),
  )
  const [rangeEnd, setRangeEnd] = useState(
    new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  )
  const [todos, setTodos] = useState<TodoModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await api.listTodos({
      start_time_from: toRangeIso(rangeStart),
      end_time_to: toRangeIso(rangeEnd, true),
      include_series_items: true,
      pageSize: 200,
    })

    if (!response.ok) {
      setError(response.error)
      setLoading(false)
      return
    }

    setTodos(response.data.items ?? [])
    setLoading(false)
  }, [rangeEnd, rangeStart])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const grouped = useMemo(() => {
    return todos.reduce<Record<string, TodoModel[]>>((acc, todo) => {
      const key = formatDateOnly(todo.start_time)
      acc[key] = acc[key] ? [...acc[key], todo] : [todo]
      return acc
    }, {})
  }, [todos])

  const sortedGroups = useMemo(() => {
    return Object.entries(grouped).sort((a, b) => {
      const dateA = new Date(a[1][0]?.start_time ?? '').getTime()
      const dateB = new Date(b[1][0]?.start_time ?? '').getTime()
      return dateA - dateB
    })
  }, [grouped])

  return (
    <div className="space-y-6">
      <PageHeader
        title="日程视图"
        description="按日期浏览你的任务安排。"
        actions={
          <Button variant="flat" onPress={loadData}>
            刷新
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <Input
          label="开始日期"
          type="date"
          value={rangeStart}
          onValueChange={setRangeStart}
        />
        <Input
          label="结束日期"
          type="date"
          value={rangeEnd}
          onValueChange={setRangeEnd}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner color="success" />
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : sortedGroups.length === 0 ? (
        <EmptyState
          title="暂无日程"
          description="当前日期范围内没有任务。"
          icon="🗓️"
        />
      ) : (
        <div className="space-y-4">
          {sortedGroups.map(([day, items]) => (
            <Card key={day} className="app-surface app-card rounded-3xl">
              <CardHeader>
                <p className="text-lg font-semibold text-[var(--ink-strong)]">
                  {day}
                </p>
              </CardHeader>
              <CardBody className="app-card-body space-y-3">
                {items.map((todo) => (
                  <div
                    key={todo.id}
                    className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] px-4 py-3"
                  >
                    <p className="font-medium text-[var(--ink-strong)]">
                      {todo.item}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {formatDateTime(todo.start_time)} -{' '}
                      {formatDateTime(todo.end_time)}
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default SchedulePage
