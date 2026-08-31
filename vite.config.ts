import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import type { Plugin } from 'vite'

const fixtureRoot = resolve('tests/fixtures/community')
const fixtureMime = new Map([
  ['.json', 'application/json; charset=utf-8'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp'], ['.ldmcase', 'application/octet-stream'],
])

function communityFixturePlugin(): Plugin {
  return {
    name: 'community-fixtures-development-only',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
        if (!pathname.startsWith('/community-fixture/')) { next(); return }
        let relativePath: string
        try { relativePath = decodeURIComponent(pathname.slice('/community-fixture/'.length)) } catch { response.statusCode = 400; response.end('Invalid path'); return }
        const target = resolve(fixtureRoot, relativePath)
        if (!relativePath || relativePath.includes('\\') || relativePath.split('/').some((part) => part === '..') || !target.startsWith(`${fixtureRoot}${sep}`)) { response.statusCode = 403; response.end('Forbidden'); return }
        void stat(target).then((info) => {
          if (!info.isFile()) { next(); return }
          response.setHeader('Content-Type', fixtureMime.get(extname(target).toLowerCase()) ?? 'application/octet-stream')
          response.setHeader('Content-Length', String(info.size))
          createReadStream(target).pipe(response)
        }).catch(() => next())
      })
    },
  }
}

export function resolveBase(repository?: string): string {
  if (!repository) return '/'
  const repositoryName = repository.split('/').at(-1)
  return repositoryName ? `/${repositoryName}/` : '/'
}

export default defineConfig({
  base: resolveBase(process.env.GITHUB_REPOSITORY),
  plugins: [react(), communityFixturePlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts',
    css: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
