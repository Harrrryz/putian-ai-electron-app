import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'http://127.0.0.1:8089/schema/openapi.json',
  output: {
    path: 'packages/renderer/src/api/generated',
    tsConfigPath: 'packages/renderer/tsconfig.app.json',
  },
  plugins: [
    {
      name: '@hey-api/client-fetch',
      runtimeConfigPath: '../client-config.ts',
    },
  ],
})
