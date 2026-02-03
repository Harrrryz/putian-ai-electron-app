import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Switch,
  Textarea,
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
        <Spinner color="default" />
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
            color="default"
            variant="flat"
            className="app-btn app-btn-primary"
            onPress={openNew}
          >
            新建任务
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="搜索任务"
          value={search}
          onValueChange={setSearch}
          className="max-w-sm"
        />
        <Switch
          size="sm"
          color="default"
          isSelected={includeSeriesItems}
          onValueChange={setIncludeSeriesItems}
          classNames={{
            base: 'gap-2',
            label: 'text-[10px] uppercase tracking-[0.2em] text-[var(--ink-soft)]',
          }}
        >
          周期任务
        </Switch>
        <Button
          color="default"
          variant="flat"
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
          <CardHeader className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-[var(--ink-strong)]">
                近 7 天任务
              </p>
              <p className="text-xs text-[var(--ink-soft)]">
                共 {currentTodos.length} 条
              </p>
            </div>
          </CardHeader>
          <CardBody className="app-card-body">
            <div className="max-h-[60vh] overflow-auto pr-1">
              <div className="grid gap-4 lg:grid-cols-2">
                {currentTodos.map((todo) => (
                  <Card key={todo.id} className="app-surface app-card rounded-lg">
                    <CardHeader className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-[var(--ink-strong)]">
                          {todo.item}
                        </p>
                        <p className="text-xs text-[var(--ink-soft)]">
                          {formatDateTime(todo.start_time)} -{' '}
                          {formatDateTime(todo.end_time)}
                        </p>
                      </div>
                      <Chip
                        color="default"
                        variant="flat"
                        size="sm"
                        className="app-chip"
                      >
                        {todo.importance}
                      </Chip>
                    </CardHeader>
                    <CardBody className="app-card-body space-y-3">
                      <p className="text-sm text-[var(--ink-soft)]">
                        {todo.description || '暂无描述'}
                      </p>
                      {todo.tags && todo.tags.length ? (
                        <div className="flex flex-wrap gap-2">
                          {todo.tags.map((tag) => (
                            <Chip
                              key={tag}
                              size="sm"
                              variant="flat"
                              className="app-chip"
                            >
                              {tag}
                            </Chip>
                          ))}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          color="default"
                          variant="flat"
                          className="app-btn"
                          onPress={() => openEdit(todo)}
                        >
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          color="default"
                          variant="flat"
                          className="app-btn app-btn-ghost"
                          onPress={() => handleDelete(todo.id)}
                          isLoading={saving}
                        >
                          删除
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="app-surface app-card rounded-lg">
        <CardHeader className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-[var(--ink-strong)]">
              历史任务
            </p>
            <p className="text-xs text-[var(--ink-soft)]">
              起始时间早于今天的任务
            </p>
          </div>
          <Button
            color="default"
            variant="flat"
            size="sm"
            className="app-btn"
            onPress={() => setHistoryOpen((prev) => !prev)}
          >
            {historyOpen ? '收起' : '展开'}
          </Button>
        </CardHeader>
        <CardBody className="app-card-body space-y-3">
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
        </CardBody>
      </Card>

      <Divider className="my-4" />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="app-surface app-card rounded-lg">
          <CardHeader>
            <p className="text-lg font-semibold text-[var(--ink-strong)]">
              标签管理
            </p>
          </CardHeader>
          <CardBody className="app-card-body space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.length ? (
                tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    size="sm"
                    variant="flat"
                    className="app-chip cursor-pointer"
                    onClose={() => handleDeleteTag(tag.id)}
                  >
                    {tag.name}
                  </Chip>
                ))
              ) : (
                <p className="text-sm text-[var(--ink-soft)]">暂无标签</p>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
              <Input
                label="新标签"
                value={tagDraft.name}
                onValueChange={(value) =>
                  setTagDraft((prev) => ({ ...prev, name: value }))
                }
              />
              <Input
                label="颜色"
                placeholder="#E07A5F"
                value={tagDraft.color}
                onValueChange={(value) =>
                  setTagDraft((prev) => ({ ...prev, color: value }))
                }
              />
              <Button
                color="default"
                variant="flat"
                className="app-btn app-btn-primary"
                onPress={handleCreateTag}
                isLoading={tagBusy}
              >
                创建标签
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal isOpen={modalOpen} onOpenChange={setModalOpen} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-lg font-semibold">
                {formState.id ? '编辑任务' : '新建任务'}
              </ModalHeader>
              <ModalBody className="space-y-3">
                <Input
                  label="任务名称"
                  value={formState.item}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, item: value }))
                  }
                />
                <Textarea
                  label="描述"
                  value={formState.description}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, description: value }))
                  }
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="开始时间"
                    type="datetime-local"
                    value={formState.start_time}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, start_time: value }))
                    }
                  />
                  <Input
                    label="结束时间"
                    type="datetime-local"
                    value={formState.end_time}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, end_time: value }))
                    }
                  />
                  <Input
                    label="提醒时间"
                    type="datetime-local"
                    value={formState.alarm_time}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, alarm_time: value }))
                    }
                  />
                  <div>
                    <label className="text-xs text-[var(--ink-soft)]">
                      重要程度
                    </label>
                    <select
                      className="mt-2 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"
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
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  variant="flat"
                  className="app-btn"
                  onPress={onClose}
                >
                  取消
                </Button>
                <Button
                  color="default"
                  variant="flat"
                  className="app-btn app-btn-primary"
                  onPress={handleSave}
                  isLoading={saving}
                >
                  保存
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default TodosPage
