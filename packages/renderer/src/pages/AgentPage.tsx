import {
  Button,
  Card,
  Input,
  Label,
  Separator,
  Spinner,
  TextField,
} from '@heroui/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/service'
import type { UsageStatsResponse } from '../api/generated/types.gen'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { BotIcon } from '../components/Icons'
import { formatDateTime } from '../utils/datetime'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
}

const AGENT_OPTIONS = [
  { label: 'TodoOrchestratorAgent', value: 'TodoOrchestratorAgent' },
  { label: 'TodoAssistant', value: 'TodoAssistant' },
]

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
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [usage, setUsage] = useState<UsageStatsResponse | null>(null)
  const [selectedAgent, setSelectedAgent] = useState(AGENT_OPTIONS[0].value)
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true)
  const [expandedToolMessages, setExpandedToolMessages] = useState<
    Record<string, boolean>
  >({})
  const streamController = useRef<AbortController | null>(null)
  const messageContainerRef = useRef<HTMLDivElement | null>(null)
  const hasLoadedRef = useRef(false)

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
    setIsPinnedToBottom(true)
    setMessages(mapHistory(history))
    setExpandedToolMessages({})
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
        setActiveSession(sessionId)
        await loadHistory(sessionId)
      }
    } else {
      setActiveSession(sessionList[0])
      await loadHistory(sessionList[0])
    }

    await loadUsage()
    setLoading(false)
  }, [loadHistory, loadUsage])

  const scrollToBottom = useCallback(() => {
    const container = messageContainerRef.current
    if (!container) {
      return
    }
    container.scrollTop = container.scrollHeight
  }, [])

  const handleMessagesScroll = useCallback(() => {
    const container = messageContainerRef.current
    if (!container) {
      return
    }
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    setIsPinnedToBottom(distanceFromBottom <= 40)
  }, [])

  useEffect(() => {
    if (hasLoadedRef.current) {
      return
    }
    hasLoadedRef.current = true
    void loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (!isPinnedToBottom) {
      return
    }
    const frame = requestAnimationFrame(scrollToBottom)
    return () => cancelAnimationFrame(frame)
  }, [isPinnedToBottom, messages, scrollToBottom])

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
    const resolvedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const timezone = resolvedTimezone || undefined

    streamController.current?.abort()
    const controller = new AbortController()
    streamController.current = controller

    setIsPinnedToBottom(true)
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

    const stream = await api.agentCreateStream(
      {
        messages: [{ role: 'user', content }],
        sessionid: activeSession,
        agentname: selectedAgent,
        timezone,
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

    setActiveSession(sessionId)
    setIsPinnedToBottom(true)
    setMessages([])
    setExpandedToolMessages({})
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
        title="AI 助手"
        description="通过对话快速创建并调整任务。"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {usage ? (
              <div className="rounded-md bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink-soft)]">
                <p>本月用量：{usage.usage_count}</p>
                <p>剩余：{usage.remaining_quota}</p>
              </div>
            ) : null}
            <div className="flex items-center gap-2 rounded-md bg-[var(--surface-muted)] px-3 py-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                Agent
              </span>
              <select
                className="bg-transparent text-sm font-medium text-[var(--ink-strong)] focus:outline-none"
                value={selectedAgent}
                onChange={(event) => setSelectedAgent(event.target.value)}
              >
                {AGENT_OPTIONS.map((agent) => (
                  <option key={agent.value} value={agent.value}>
                    {agent.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="secondary"
              className="app-btn"
              onPress={handleNewSession}
            >
              新建会话
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        <Card className="app-surface app-card rounded-lg">
          <Card.Content className="flex-1 min-h-0 p-0">
            <div
              ref={messageContainerRef}
              className="h-full overflow-auto space-y-3 px-4 py-3"
              onScroll={handleMessagesScroll}
            >
              {messages.length ? (
                messages.map((message) => {
                  const isTool = message.role === 'tool'
                  const isExpanded =
                    !isTool || Boolean(expandedToolMessages[message.id])

                  return (
                    <div
                      key={message.id}
                      className={`rounded-lg px-4 py-3 text-sm ${
                        message.role === 'user'
                          ? 'ml-auto bg-[var(--accent)] text-[var(--app-bg)]'
                          : 'bg-[var(--surface-muted)] text-[var(--ink-strong)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.2em] opacity-70">
                          {message.role}
                        </p>
                        {isTool ? (
                          <button
                            type="button"
                            className="text-xs text-[var(--ink-soft)] underline"
                            onClick={() =>
                              setExpandedToolMessages((prev) => ({
                                ...prev,
                                [message.id]: !prev[message.id],
                              }))
                            }
                          >
                            {isExpanded ? '收起' : '展开'}
                          </button>
                        ) : null}
                      </div>
                      {isTool && !isExpanded ? (
                        <p className="mt-2 text-xs text-[var(--ink-soft)]">
                          已折叠，点击展开查看工具输出。
                        </p>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      )}
                    </div>
                  )
                })
              ) : (
                <EmptyState
                  title="开始一段对话"
                  description="例如：帮我安排明天上午的学习计划。"
                  icon={<BotIcon className="h-6 w-6" />}
                />
              )}
            </div>
          </Card.Content>
        </Card>

        <Card className="app-surface app-card rounded-lg">
          <Card.Content className="app-card-body space-y-3">
            <TextField
              value={draft}
              onChange={setDraft}
              className="space-y-1"
            >
              <Label className="app-label">发送消息</Label>
              <Input
                placeholder="输入你的需求..."
                className="app-input"
                disabled={!activeSession}
              />
            </TextField>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                className="app-btn app-btn-primary"
                onPress={handleSend}
                isPending={sending}
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
          </Card.Content>
        </Card>
      </div>

      <Separator />

      <Card className="app-surface app-card rounded-lg">
        <Card.Header>
          <p className="text-sm text-[var(--ink-soft)]">
            小提示：AI 助手默认使用 TodoOrchestratorAgent，可根据需求切换不同 agent。
          </p>
        </Card.Header>
      </Card>
    </div>
  )
}

export default AgentPage
