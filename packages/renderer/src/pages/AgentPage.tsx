import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Spinner,
} from '@heroui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/service'
import type { UsageStatsResponse } from '../api/generated/types.gen'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { formatDateTime } from '../utils/datetime'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
}

const createId = () =>
  `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`

const normalizeContent = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }

  if (value === null || value === undefined) {
    return ''
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const mapHistory = (history: unknown[]): ChatMessage[] =>
  history.map((item) => {
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>
      if (typeof record.role === 'string' && 'content' in record) {
        return {
          id: createId(),
          role: record.role as ChatMessage['role'],
          content: normalizeContent(record.content),
        }
      }
      if (typeof record.event === 'string') {
        return {
          id: createId(),
          role: 'tool',
          content: `${record.event}: ${normalizeContent(record.data)}`,
        }
      }
    }

    return {
      id: createId(),
      role: 'assistant',
      content: normalizeContent(item),
    }
  })

const AgentPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<string[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [usage, setUsage] = useState<UsageStatsResponse | null>(null)
  const streamController = useRef<AbortController | null>(null)

  const loadUsage = useCallback(async () => {
    const response = await api.getUsageStats()
    if (response.ok) {
      setUsage(response.data)
    }
  }, [])

  const loadHistory = useCallback(async (sessionId: string) => {
    const response = await api.getSessionHistory(sessionId, 20)
    if (!response.ok) {
      setError(response.error)
      return
    }

    const history = (response.data as { history?: unknown[] }).history ?? []
    setMessages(mapHistory(history))
  }, [])

  const loadSessions = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await api.listAgentSessions()
    if (!response.ok) {
      setError(response.error)
      setLoading(false)
      return
    }

    const payload = response.data as { sessions?: string[] }
    const sessionList = payload.sessions ?? []

    if (sessionList.length === 0) {
      const created = await api.createAgentSession()
      if (!created.ok) {
        setError(created.error)
        setLoading(false)
        return
      }

      const sessionId = (created.data as { session_id?: string }).session_id
      if (sessionId) {
        setSessions([sessionId])
        setActiveSession(sessionId)
        await loadHistory(sessionId)
      }
    } else {
      setSessions(sessionList)
      setActiveSession(sessionList[0])
      await loadHistory(sessionList[0])
    }

    await loadUsage()
    setLoading(false)
  }, [loadHistory, loadUsage])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  useEffect(() => {
    return () => {
      streamController.current?.abort()
    }
  }, [])

  const handleSend = async () => {
    if (!draft.trim() || !activeSession) {
      return
    }

    const content = draft.trim()
    setDraft('')
    setError(null)
    setSending(true)
    const assistantId = createId()

    streamController.current?.abort()
    const controller = new AbortController()
    streamController.current = controller

    setMessages((prev) => [
      ...prev,
      { id: createId(), role: 'user', content },
      { id: assistantId, role: 'assistant', content: '' },
    ])

    const appendAssistant = (delta: string) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: message.content + delta }
            : message,
        ),
      )
    }

    const addToolMessage = (label: string, data: unknown) => {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'tool',
          content: `${label}: ${normalizeContent(data)}`,
        },
      ])
    }

    const stream = api.agentCreateStream(
      {
        messages: [{ role: 'user', content }],
        session_id: activeSession,
        agent_name: 'TodoAssistant',
      },
      {
        signal: controller.signal,
        onEvent: ({ event, data }) => {
          if (event === 'session_initialized') {
            const sessionId =
              typeof data === 'object' && data !== null
                ? (data as { session_id?: string }).session_id
                : undefined
            if (sessionId) {
              setActiveSession(sessionId)
              setSessions((prev) =>
                prev.includes(sessionId) ? prev : [sessionId, ...prev],
              )
            }
            return
          }

          if (event === 'message_delta') {
            const chunk =
              typeof data === 'object' && data !== null
                ? (data as { content?: string }).content
                : undefined
            if (chunk) {
              appendAssistant(chunk)
            }
            return
          }

          if (event === 'completed') {
            const finalMessage =
              typeof data === 'object' && data !== null
                ? (data as { final_message?: string }).final_message
                : undefined
            if (finalMessage) {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId
                    ? { ...message, content: finalMessage }
                    : message,
                ),
              )
            }
            return
          }

          if (event === 'tool_call') {
            addToolMessage('工具调用', data)
            return
          }

          if (event === 'tool_result') {
            addToolMessage('工具结果', data)
            return
          }

          if (event === 'agent_updated') {
            addToolMessage('代理更新', data)
            return
          }

          if (event === 'error') {
            const message =
              typeof data === 'object' && data !== null
                ? (data as { message?: string }).message
                : undefined
            setError(message ?? 'AI 流式响应失败')
          }
        },
        onError: (err) => {
          setError(normalizeContent(err))
        },
      },
    )

    try {
      for await (const chunk of stream.stream) {
        void chunk
      }
    } catch (err) {
      setError(normalizeContent(err))
    } finally {
      setSending(false)
      await loadUsage()
    }
  }

  const handleNewSession = async () => {
    const response = await api.createAgentSession()
    if (!response.ok) {
      setError(response.error)
      return
    }

    const sessionId = (response.data as { session_id?: string }).session_id
    if (!sessionId) {
      setError('创建会话失败')
      return
    }

    setSessions((prev) => [sessionId, ...prev])
    setActiveSession(sessionId)
    setMessages([])
  }

  const activeSessionLabel = useMemo(() => {
    if (!activeSession) {
      return '暂无会话'
    }
    return activeSession.replace('user_', 'User ').slice(0, 24)
  }, [activeSession])

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
        title="AI 助手"
        description="通过对话快速创建并调整任务。"
        actions={
          <Button variant="flat" onPress={handleNewSession}>
            新建会话
          </Button>
        }
      />

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="app-surface rounded-3xl">
          <CardHeader className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--ink-strong)]">
              会话列表
            </p>
            <Chip size="sm" variant="flat" color="success">
              {sessions.length}
            </Chip>
          </CardHeader>
          <CardBody className="space-y-2">
            {sessions.length ? (
              sessions.map((session) => (
                <button
                  key={session}
                  className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${
                    session === activeSession
                      ? 'bg-[var(--accent-soft)] text-[var(--ink-strong)]'
                      : 'hover:bg-white/60'
                  }`}
                  onClick={() => {
                    setActiveSession(session)
                    void loadHistory(session)
                  }}
                >
                  {session.slice(0, 26)}
                </button>
              ))
            ) : (
              <p className="text-sm text-[var(--ink-soft)]">暂无会话</p>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card className="app-surface rounded-3xl">
            <CardHeader className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                  当前会话
                </p>
                <p className="text-lg font-semibold text-[var(--ink-strong)]">
                  {activeSessionLabel}
                </p>
              </div>
              {usage ? (
                <div className="text-right text-xs text-[var(--ink-soft)]">
                  <p>本月用量：{usage.usage_count}</p>
                  <p>剩余：{usage.remaining_quota}</p>
                </div>
              ) : null}
            </CardHeader>
            <CardBody className="space-y-3">
              {messages.length ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      message.role === 'user'
                        ? 'ml-auto bg-[var(--accent)] text-white'
                        : 'bg-white/70 text-[var(--ink-strong)]'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] opacity-70">
                      {message.role}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="开始一段对话"
                  description="例如：帮我安排明天上午的学习计划。"
                  icon="🤖"
                />
              )}
            </CardBody>
          </Card>

          <Card className="app-surface rounded-3xl">
            <CardBody className="space-y-3">
              <Input
                label="发送消息"
                placeholder="输入你的需求..."
                value={draft}
                onValueChange={setDraft}
                isDisabled={!activeSession}
              />
              <div className="flex items-center gap-2">
                <Button
                  color="success"
                  onPress={handleSend}
                  isLoading={sending}
                  isDisabled={!draft.trim() || !activeSession}
                >
                  发送
                </Button>
                {usage ? (
                  <p className="text-xs text-[var(--ink-soft)]">
                    重置时间：{formatDateTime(usage.reset_date)}
                  </p>
                ) : null}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Divider />

      <Card className="app-surface rounded-3xl">
        <CardHeader>
          <p className="text-sm text-[var(--ink-soft)]">
            小提示：AI 助手默认使用 TodoAssistant，可自动创建 Todo 并识别时间。
          </p>
        </CardHeader>
      </Card>
    </div>
  )
}

export default AgentPage
