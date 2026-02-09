import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  Modal,
  Separator,
  Spinner,
  Switch,
  TextArea,
  TextField,
} from '@heroui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, importanceOptions } from '../api/service'
import type { TagModel, TodoCreate, TodoModel } from '../api/generated/types.gen'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { TodoIcon } from '../components/Icons'
import { formatDateTime, toDatetimeLocal, toIsoString } from '../utils/datetime'

type TodoFormState = {
  id?: string
  item: string
  description: string
  start_time: string
  end_time: string
  alarm_time: string
  importance: string
}

type DescriptionMeta = {
  raw: string
  listItems: string[]
  hasOverflow: boolean
  isEmpty: boolean
}

const emptyForm: TodoFormState = {
  item: '',
  description: '',
  start_time: '',
  end_time: '',
  alarm_time: '',
  importance: 'none',
}

const startOfDay = (value: Date) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const endOfDay = (value: Date) => {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

const normalizeDescription = (description?: string | null): DescriptionMeta => {
  const rawText = (description ?? '').trim()
  if (!rawText) {
    return {
      raw: '暂无描述',
      listItems: [],
      hasOverflow: false,
      isEmpty: true,
    }
  }

  const normalized = rawText.replace(/\r\n/g, '\n')
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const stripMarker = (value: string) =>
    value.replace(/^(\d+\.|[-*•])\s+/, '').trim()

  let listItems: string[] = []

  if (lines.length > 1) {
    listItems = lines.map(stripMarker).filter(Boolean)
  } else if (/\d+\.\s+/.test(normalized)) {
    const parts = normalized
      .split(/\d+\.\s+/)
      .map((part) => part.trim())
      .filter(Boolean)
    if (parts.length > 1) {
      listItems = parts
    }
  }

  return {
    raw: normalized,
    listItems,
    hasOverflow: listItems.length > 2 || normalized.length > 60 || lines.length > 2,
    isEmpty: false,
  }
}

const TodosPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTodos, setCurrentTodos] = useState<TodoModel[]>([])
  const [historyTodos, setHistoryTodos] = useState<TodoModel[]>([])
  const [tags, setTags] = useState<TagModel[]>([])
  const [search, setSearch] = useState('')
  const [includeSeriesItems, setIncludeSeriesItems] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [formState, setFormState] = useState<TodoFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [tagDraft, setTagDraft] = useState({ name: '', color: '' })
  const [tagBusy, setTagBusy] = useState(false)
  const [expandedTodos, setExpandedTodos] = useState<Record<string, boolean>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const todayStart = startOfDay(new Date())
    const rangeEnd = endOfDay(
      new Date(todayStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    )
    const historyEnd = new Date(todayStart.getTime() - 1)

    const [currentResponse, historyResponse, tagResponse] = await Promise.all([
      api.listTodos({
        searchString: search,
        include_series_items: includeSeriesItems,
        start_time_from: todayStart.toISOString(),
        end_time_to: rangeEnd.toISOString(),
        pageSize: 120,
      }),
      api.listTodos({
        searchString: search,
        include_series_items: includeSeriesItems,
        start_time_to: historyEnd.toISOString(),
        pageSize: 200,
      }),
      api.listTags(),
    ])

    if (!currentResponse.ok) {
      setError(currentResponse.error)
      setLoading(false)
      return
    }

    if (!historyResponse.ok) {
      setError(historyResponse.error)
      setLoading(false)
      return
    }

    if (!tagResponse.ok) {
      setError(tagResponse.error)
      setLoading(false)
      return
    }

    setCurrentTodos(currentResponse.data.items ?? [])
    setHistoryTodos(historyResponse.data.items ?? [])
    setTags(tagResponse.data.items ?? [])
    setLoading(false)
  }, [includeSeriesItems, search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const historySummary = useMemo(() => {
    if (historyTodos.length === 0) {
      return '暂无历史任务'
    }
    return `已折叠 ${historyTodos.length} 条历史任务`
  }, [historyTodos])

  const openNew = () => {
    setFormState(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (todo: TodoModel) => {
    setFormState({
      id: todo.id,
      item: todo.item,
      description: todo.description ?? '',
      start_time: toDatetimeLocal(todo.start_time),
      end_time: toDatetimeLocal(todo.end_time),
      alarm_time: toDatetimeLocal(todo.alarm_time),
      importance: todo.importance ?? 'none',
    })
    setFormError(null)
    setModalOpen(true)
  }

  const toggleExpanded = (todoId: string) => {
    setExpandedTodos((prev) => ({ ...prev, [todoId]: !prev[todoId] }))
  }

  const handleSave = async () => {
    setFormError(null)

    if (!formState.item || !formState.start_time || !formState.end_time) {
      setFormError('请补全任务名称、开始时间与结束时间。')
      return
    }

    const payload: TodoCreate = {
      item: formState.item,
      description: formState.description || undefined,
      starttime: toIsoString(formState.start_time),
      endtime: toIsoString(formState.end_time),
      alarmtime: formState.alarm_time
        ? toIsoString(formState.alarm_time)
        : undefined,
      importance: formState.importance as TodoCreate['importance'],
    }

    setSaving(true)

    const response = formState.id
      ? await api.updateTodo(formState.id, payload)
      : await api.createTodo(payload)

    setSaving(false)

    if (!response.ok) {
      setFormError(response.error)
      return
    }

    setModalOpen(false)
    void loadData()
  }

  const handleDelete = async (todoId: string) => {
    setSaving(true)
    const response = await api.deleteTodo(todoId)
    setSaving(false)

    if (!response.ok) {
      setError(response.error)
      return
    }

    void loadData()
  }

  const handleCreateTag = async () => {
    if (!tagDraft.name) {
      setError('请输入标签名称。')
      return
    }

    setTagBusy(true)
    const response = await api.createTag({
      name: tagDraft.name,
      color: tagDraft.color || undefined,
    })
    setTagBusy(false)

    if (!response.ok) {
      setError(response.error)
      return
    }

    setTagDraft({ name: '', color: '' })
    void loadData()
  }

  const handleDeleteTag = async (tagId: string) => {
    setTagBusy(true)
    const response = await api.deleteTag(tagId)
    setTagBusy(false)

    if (!response.ok) {
      setError(response.error)
      return
    }

    void loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Todo 管理"
        description="集中管理任务、时间与优先级。"
        actions={
          <Button
            variant="primary"
            className="app-btn app-btn-primary"
            onPress={openNew}
          >
            新建任务
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="搜索任务"
          placeholder="搜索任务"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="app-input max-w-sm"
        />
        <Switch
          size="sm"
          isSelected={includeSeriesItems}
          onChange={setIncludeSeriesItems}
          className="gap-2"
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Label className="text-[10px] uppercase tracking-[0.2em] text-[var(--ink-soft)]">
            周期任务
          </Label>
        </Switch>
        <Button
          variant="secondary"
          className="app-btn"
          onPress={loadData}
        >
          刷新列表
        </Button>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {currentTodos.length === 0 ? (
        <EmptyState
          title="暂无任务"
          description="最近 7 天暂无任务，可以通过搜索或新建补充。"
          actionLabel="新建任务"
          onAction={openNew}
          icon={<TodoIcon className="h-6 w-6" />}
        />
      ) : (
        <Card className="app-surface app-card rounded-lg">
          <Card.Header className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-[var(--ink-strong)]">
                近 7 天任务
              </p>
              <p className="text-xs text-[var(--ink-soft)]">
                共 {currentTodos.length} 条
              </p>
            </div>
          </Card.Header>
          <Card.Content className="app-card-body">
            <div className="max-h-[32vh] overflow-auto pr-1">
              <div className="grid gap-5 lg:grid-cols-2">
                {currentTodos.map((todo) => {
                  const { raw, listItems, hasOverflow, isEmpty } =
                    normalizeDescription(todo.description)
                  const isExpanded = Boolean(expandedTodos[todo.id])
                  const showToggle = hasOverflow && !isEmpty
                  const showList = listItems.length > 1
                  const tags = todo.tags ?? []
                  const extraTagCount = tags.length
                  const visibleItems =
                    !isExpanded && listItems.length > 2
                      ? listItems.slice(0, 2)
                      : listItems

                  return (
                    <Card key={todo.id} className="app-surface app-card rounded-lg">
                      <Card.Header className="flex items-start justify-between gap-2 px-2 pb-1 pt-2">
                        <div className="space-y-0.5">
                          <p className="text-[13px] font-semibold text-[var(--ink-strong)]">
                            {todo.item}
                          </p>
                          <p className="text-[10px] text-[var(--ink-soft)]">
                            {formatDateTime(todo.start_time)} -{' '}
                            {formatDateTime(todo.end_time)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {extraTagCount > 0 ? (
                            <Chip
                              size="sm"
                              variant="secondary"
                              className="app-chip px-2 py-0 text-[10px] leading-tight opacity-70"
                            >
                              +{extraTagCount}
                            </Chip>
                          ) : null}
                          <Chip
                            color="default"
                            variant="secondary"
                            size="sm"
                            className="app-chip px-2 py-0 text-[10px] leading-tight"
                          >
                            {todo.importance}
                          </Chip>
                        </div>
                      </Card.Header>
                      <Card.Content className="app-card-body space-y-2 px-2 pb-2 pt-1">
                        <div className="space-y-2">
                          {showList ? (
                            <ul className="app-text-list">
                              {visibleItems.map((item, index) => (
                                <li key={`${todo.id}-desc-${index}`}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p
                              className={`text-[12px] text-[var(--ink-soft)] leading-[1.35] ${
                                !isExpanded && hasOverflow ? 'app-clamp-2' : ''
                              }`}
                            >
                              {raw}
                            </p>
                          )}
                          {!isExpanded && listItems.length > 2 ? (
                            <p className="text-xs text-[var(--ink-soft)]">...</p>
                          ) : null}
                          {showToggle ? (
                            <button
                              type="button"
                              className="text-xs text-[var(--ink-strong)] underline decoration-[var(--accent-soft)] underline-offset-4"
                              onClick={() => toggleExpanded(todo.id)}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? '收起' : '展开'}
                            </button>
                          ) : null}
                        </div>
                        <div className="app-card-footer flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            className="app-btn app-btn-primary app-btn-compact"
                            onPress={() => openEdit(todo)}
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="app-btn app-btn-ghost app-btn-compact"
                            onPress={() => handleDelete(todo.id)}
                            isPending={saving}
                          >
                            删除
                          </Button>
                        </div>
                      </Card.Content>
                    </Card>
                  )
                })}
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      <Card className="app-surface app-card rounded-lg">
        <Card.Header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-[var(--ink-strong)]">
              历史任务
            </p>
            <p className="text-xs text-[var(--ink-soft)]">
              起始时间早于今天的任务
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="app-btn"
            onPress={() => setHistoryOpen((prev) => !prev)}
          >
            {historyOpen ? '收起' : '展开'}
          </Button>
        </Card.Header>
        <Card.Content className="app-card-body space-y-3">
          {!historyOpen ? (
            <p className="text-sm text-[var(--ink-soft)]">{historySummary}</p>
          ) : historyTodos.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">暂无历史任务</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {historyTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="rounded-md border border-[var(--surface-border)] bg-[var(--surface-muted)] px-4 py-3"
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
            </div>
          )}
        </Card.Content>
      </Card>

      <Separator className="my-4" />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="app-surface app-card rounded-lg">
          <Card.Header>
            <p className="text-lg font-semibold text-[var(--ink-strong)]">
              标签管理
            </p>
          </Card.Header>
          <Card.Content className="app-card-body space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.length ? (
                tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    size="sm"
                    variant="secondary"
                    className="app-chip flex items-center gap-2 px-3 py-1 text-xs"
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      className="text-[10px] text-[var(--ink-soft)] transition hover:text-[var(--ink-strong)]"
                      onClick={() => handleDeleteTag(tag.id)}
                      aria-label={`删除标签 ${tag.name}`}
                    >
                      ×
                    </button>
                  </Chip>
                ))
              ) : (
                <p className="text-sm text-[var(--ink-soft)]">暂无标签</p>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
              <TextField
                value={tagDraft.name}
                onChange={(value) =>
                  setTagDraft((prev) => ({ ...prev, name: value }))
                }
                className="space-y-1"
              >
                <Label className="app-label">新标签</Label>
                <Input
                  placeholder="标签名称"
                  className="app-input"
                />
              </TextField>
              <TextField
                value={tagDraft.color}
                onChange={(value) =>
                  setTagDraft((prev) => ({ ...prev, color: value }))
                }
                className="space-y-1"
              >
                <Label className="app-label">颜色</Label>
                <Input
                  placeholder="#E07A5F"
                  className="app-input"
                />
              </TextField>
              <Button
                variant="primary"
                className="app-btn app-btn-primary app-btn-hit w-full md:w-auto"
                onPress={handleCreateTag}
                isPending={tagBusy}
              >
                创建标签
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>

      <Modal>
        <Modal.Backdrop isOpen={modalOpen} onOpenChange={setModalOpen} />
        <Modal.Container size="lg">
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header className="text-lg font-semibold">
                  {formState.id ? '编辑任务' : '新建任务'}
                </Modal.Header>
                <Modal.Body className="space-y-3">
                  <TextField
                    value={formState.item}
                    onChange={(value) =>
                      setFormState((prev) => ({ ...prev, item: value }))
                    }
                    className="space-y-1"
                  >
                    <Label className="app-label">任务名称</Label>
                    <Input className="app-input" />
                  </TextField>
                  <TextField
                    value={formState.description}
                    onChange={(value) =>
                      setFormState((prev) => ({ ...prev, description: value }))
                    }
                    className="space-y-1"
                  >
                    <Label className="app-label">描述</Label>
                    <TextArea className="app-input app-textarea" />
                  </TextField>
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                      value={formState.start_time}
                      onChange={(value) =>
                        setFormState((prev) => ({ ...prev, start_time: value }))
                      }
                      className="space-y-1"
                    >
                      <Label className="app-label">开始时间</Label>
                      <Input type="datetime-local" className="app-input" />
                    </TextField>
                    <TextField
                      value={formState.end_time}
                      onChange={(value) =>
                        setFormState((prev) => ({ ...prev, end_time: value }))
                      }
                      className="space-y-1"
                    >
                      <Label className="app-label">结束时间</Label>
                      <Input type="datetime-local" className="app-input" />
                    </TextField>
                    <TextField
                      value={formState.alarm_time}
                      onChange={(value) =>
                        setFormState((prev) => ({ ...prev, alarm_time: value }))
                      }
                      className="space-y-1"
                    >
                      <Label className="app-label">提醒时间</Label>
                      <Input type="datetime-local" className="app-input" />
                    </TextField>
                    <div className="space-y-1">
                      <label className="app-label">重要程度</label>
                      <select
                        className="app-input"
                        value={formState.importance}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            importance: event.target.value,
                          }))
                        }
                      >
                        {importanceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                {formError ? (
                  <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    variant="secondary"
                    className="app-btn"
                    onPress={close}
                  >
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    className="app-btn app-btn-primary"
                    onPress={handleSave}
                    isPending={saving}
                  >
                    保存
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal>
    </div>
  )
}

export default TodosPage
