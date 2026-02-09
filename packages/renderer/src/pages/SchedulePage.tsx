import dayGridPlugin from '@fullcalendar/react/daygrid'
import FullCalendar, {
  type DatesSetData,
  type EventInput,
} from '@fullcalendar/react'
import interactionPlugin from '@fullcalendar/react/interaction'
import listPlugin from '@fullcalendar/react/list'
import zhCnLocale from '@fullcalendar/react/locales/zh-cn'
import multimonthPlugin from '@fullcalendar/react/multimonth'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import themePlugin from '@fullcalendar/react/themes/monarch'
import { Button, Spinner } from '@heroui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/service'
import type { TodoModel } from '../api/generated/types.gen'
import PageHeader from '../components/PageHeader'
import { formatDateTime } from '../utils/datetime'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/monarch/theme.css'
import '@fullcalendar/react/themes/monarch/palettes/purple.css'

type VisibleRange = {
  start: Date
  end: Date
}

const createInitialRange = (): VisibleRange => {
  const now = new Date()
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  }
}

const formatTooltipTime = (date: Date | null) => {
  return date ? formatDateTime(date.toISOString()) : '未设置'
}

const SchedulePage = () => {
  const [visibleRange, setVisibleRange] = useState<VisibleRange>(
    createInitialRange,
  )
  const [todos, setTodos] = useState<TodoModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await api.listTodos({
      start_time_from: visibleRange.start.toISOString(),
      end_time_to: new Date(visibleRange.end.getTime() - 1).toISOString(),
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
  }, [visibleRange.end, visibleRange.start])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const events = useMemo<EventInput[]>(() => {
    return todos.map((todo) => ({
      id: todo.id,
      title: todo.item,
      start: todo.start_time,
      end: todo.end_time,
      extendedProps: {
        description: todo.description,
        importance: todo.importance,
      },
    }))
  }, [todos])

  const handleDatesSet = useCallback((payload: DatesSetData) => {
    const nextStartIso = payload.start.toISOString()
    const nextEndIso = payload.end.toISOString()

    setVisibleRange((previous) => {
      if (
        previous.start.toISOString() === nextStartIso &&
        previous.end.toISOString() === nextEndIso
      ) {
        return previous
      }

      return {
        start: new Date(payload.start),
        end: new Date(payload.end),
      }
    })
  }, [])

  return (
    <div className="space-y-4">
      <PageHeader
        title="日程视图"
        actions={
          <Button
            variant="secondary"
            className="app-btn"
            onPress={loadData}
          >
            刷新
          </Button>
        }
      />

      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="app-surface rounded-lg p-2 md:p-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        ) : null}

        <FullCalendar
          locale={zhCnLocale}
          plugins={[
            themePlugin,
            interactionPlugin,
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            multimonthPlugin,
          ]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek,multiMonthYear',
          }}
          todayText="今天"
          monthText="月"
          weekText="周"
          dayText="日"
          listText="列表"
          dayMaxEvents
          events={events}
          datesSet={handleDatesSet}
          eventDidMount={({ event, el }) => {
            el.title = `${event.title}\n${formatTooltipTime(event.start)} - ${formatTooltipTime(event.end)}`
          }}
          height="auto"
        />
      </div>
    </div>
  )
}

export default SchedulePage
