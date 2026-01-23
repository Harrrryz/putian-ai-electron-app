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
  Textarea,
} from '@heroui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, importanceOptions } from '../api/service'
import type { TagModel, TodoCreate, TodoModel } from '../api/generated/types.gen'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
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

const TodosPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [todos, setTodos] = useState<TodoModel[]>([])
  const [tags, setTags] = useState<TagModel[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [formState, setFormState] = useState<TodoFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [tagDraft, setTagDraft] = useState({ name: '', color: '' })
  const [tagBusy, setTagBusy] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [todoResponse, tagResponse] = await Promise.all([
      api.listTodos({ searchString: search, pageSize: 120 }),
      api.listTags(),
    ])

    if (!todoResponse.ok) {
      setError(todoResponse.error)
      setLoading(false)
      return
    }

    if (!tagResponse.ok) {
      setError(tagResponse.error)
      setLoading(false)
      return
    }

    setTodos(todoResponse.data.items ?? [])
    setTags(tagResponse.data.items ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const filteredTodos = useMemo(() => {
    if (!search) {
      return todos
    }
    return todos.filter((todo) =>
      todo.item.toLowerCase().includes(search.toLowerCase()),
    )
  }, [todos, search])

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
        <Spinner color="success" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Todo 管理"
        description="集中管理任务、时间与优先级。"
        actions={
          <Button color="success" onPress={openNew}>
            新建任务
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="搜索任务"
          value={search}
          onValueChange={setSearch}
          className="max-w-sm"
        />
        <Button variant="flat" onPress={loadData}>
          刷新列表
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {filteredTodos.length === 0 ? (
        <EmptyState
          title="暂无任务"
          description="创建你的第一个 Todo，开始安排日程。"
          actionLabel="新建任务"
          onAction={openNew}
          icon="🗒️"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTodos.map((todo) => (
            <Card key={todo.id} className="app-surface rounded-3xl">
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
                <Chip color="success" variant="flat" size="sm">
                  {todo.importance}
                </Chip>
              </CardHeader>
              <CardBody className="space-y-3">
                <p className="text-sm text-[var(--ink-soft)]">
                  {todo.description || '暂无描述'}
                </p>
                {todo.tags && todo.tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {todo.tags.map((tag) => (
                      <Chip key={tag} size="sm" variant="flat">
                        {tag}
                      </Chip>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="flat" onPress={() => openEdit(todo)}>
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
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
      )}

      <Divider className="my-4" />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="app-surface rounded-3xl">
          <CardHeader>
            <p className="text-lg font-semibold text-[var(--ink-strong)]">
              标签管理
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.length ? (
                tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    size="sm"
                    variant="flat"
                    className="cursor-pointer"
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
              <Button color="success" onPress={handleCreateTag} isLoading={tagBusy}>
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
                      className="mt-2 w-full rounded-xl border border-[var(--surface-border)] bg-white/80 px-3 py-2 text-sm"
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
                  <div className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  取消
                </Button>
                <Button color="success" onPress={handleSave} isLoading={saving}>
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
