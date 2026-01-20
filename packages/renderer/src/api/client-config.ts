import type { CreateClientConfig } from './generated/client'

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8089'

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
})
