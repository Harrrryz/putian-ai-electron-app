import {
  accountLogin,
  accountLogout,
  accountProfile,
  accountRegister,
  agentCreateTodo,
  createNewSession,
  createTag,
  createTodo,
  deleteTag,
  deleteTodo,
  getSessionHistory,
  getUsageStats,
  listAgentSessions,
  listTags,
  listTodos,
  resendVerification,
  updateTodo,
} from './generated/sdk.gen'
import type {
  AccountLogin,
  AccountProfileResponse,
  AccountRegister,
  AgentCreateTodoResponse,
  AgentTodoRequest,
  CreateNewSessionResponse,
  CreateTagResponse,
  CreateTodoResponse,
  DeleteTagResponse,
  DeleteTodoResponse,
  GetSessionHistoryResponse,
  GetUsageStatsResponse,
  Importance,
  ListAgentSessionsResponse,
  ListTagsResponse,
  ListTodosResponse,
  OAuth2Login,
  ResendVerificationResponse,
  TagCreate,
  TodoCreate,
  UpdateTodoResponse,
  User,
} from './generated/types.gen'
import { client } from './generated/client.gen'

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status?: number }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const formatError = (error: unknown): string => {
  if (!error) {
    return '请求失败，请稍后再试。'
  }

  if (typeof error === 'string') {
    return error
  }

  if (isRecord(error)) {
    const detail = error.detail
    if (typeof detail === 'string') {
      return detail
    }
    if (Array.isArray(detail)) {
      const first = detail[0]
      if (typeof first === 'string') {
        return first
      }
    }
  }

  return '请求失败，请稍后再试。'
}

const toResult = async <T>(
  promise: Promise<{ data?: unknown; response?: Response; error?: unknown }>,
): Promise<ApiResult<T>> => {
  const result = await promise

  if ('error' in result && result.error) {
    return {
      ok: false,
      error: formatError(result.error),
      status: result.response?.status,
    }
  }

  return {
    ok: true,
    data: result.data as T,
    status: result.response?.status ?? 0,
  }
}

export const api = {
  login: (payload: AccountLogin) =>
    toResult<OAuth2Login>(
      accountLogin({ body: payload, responseStyle: 'fields' }),
    ),
  logout: () => toResult(accountLogout({ responseStyle: 'fields' })),
  profile: () =>
    toResult<AccountProfileResponse>(
      accountProfile({ responseStyle: 'fields' }),
    ),
  register: (payload: AccountRegister) =>
    toResult<User>(
      accountRegister({ body: payload, responseStyle: 'fields' }),
    ),
  resendVerification: (email: string) =>
    toResult<ResendVerificationResponse>(
      resendVerification({
        query: { email },
        responseStyle: 'fields',
      }),
    ),
  listTodos: (query?: {
    searchString?: string
    pageSize?: number
    start_time_from?: string
    start_time_to?: string
    end_time_from?: string
    end_time_to?: string
  }) =>
    toResult<ListTodosResponse>(
      listTodos({
        query,
        responseStyle: 'fields',
      }),
    ),
  createTodo: (payload: TodoCreate) =>
    toResult<CreateTodoResponse>(
      createTodo({ body: payload, responseStyle: 'fields' }),
    ),
  updateTodo: (todoId: string, payload: TodoCreate) =>
    toResult<UpdateTodoResponse>(
      updateTodo({
        path: { todo_id: todoId },
        body: payload,
        responseStyle: 'fields',
      }),
    ),
  deleteTodo: (todoId: string) =>
    toResult<DeleteTodoResponse>(
      deleteTodo({
        path: { todo_id: todoId },
        responseStyle: 'fields',
      }),
    ),
  listTags: () =>
    toResult<ListTagsResponse>(listTags({ responseStyle: 'fields' })),
  createTag: (payload: TagCreate) =>
    toResult<CreateTagResponse>(
      createTag({ body: payload, responseStyle: 'fields' }),
    ),
  deleteTag: (tagId: string) =>
    toResult<DeleteTagResponse>(
      deleteTag({
        path: { tag_id: tagId },
        responseStyle: 'fields',
      }),
    ),
  agentCreate: (payload: AgentTodoRequest) =>
    toResult<AgentCreateTodoResponse>(
      agentCreateTodo({ body: payload, responseStyle: 'fields' }),
    ),
  agentCreateStream: (
    payload: AgentTodoRequest,
    options?: {
      onEvent?: (event: { event?: string; data: unknown }) => void
      onError?: (error: unknown) => void
      signal?: AbortSignal
    },
  ) =>
    client.sse.post({
      security: [{ scheme: 'bearer', type: 'http' }],
      url: '/api/todos/agent-create/stream',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      onSseEvent: options?.onEvent,
      onSseError: options?.onError,
      signal: options?.signal,
    }),
  listAgentSessions: () =>
    toResult<ListAgentSessionsResponse>(
      listAgentSessions({ responseStyle: 'fields' }),
    ),
  createAgentSession: () =>
    toResult<CreateNewSessionResponse>(
      createNewSession({ responseStyle: 'fields' }),
    ),
  getSessionHistory: (sessionId: string, limit = 20) =>
    toResult<GetSessionHistoryResponse>(
      getSessionHistory({
        path: { session_id: sessionId },
        query: { limit },
        responseStyle: 'fields',
      }),
    ),
  getUsageStats: () =>
    toResult<GetUsageStatsResponse>(
      getUsageStats({ responseStyle: 'fields' }),
    ),
}

export const importanceOptions: Array<{ label: string; value: Importance }> = [
  { label: '不重要', value: 'none' },
  { label: '较低', value: 'low' },
  { label: '中等', value: 'medium' },
  { label: '高', value: 'high' },
]
