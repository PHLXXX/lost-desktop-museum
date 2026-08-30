import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export function resolveBase(repository?: string): string {
  if (!repository) return '/'
  const repositoryName = repository.split('/').at(-1)
  return repositoryName ? `/${repositoryName}/` : '/'
}

export default defineConfig({
  base: resolveBase(process.env.GITHUB_REPOSITORY),
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts',
    css: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
