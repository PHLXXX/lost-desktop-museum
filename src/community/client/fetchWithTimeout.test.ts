import { describe, expect, it, vi } from 'vitest'
import { fetchWithTimeout } from './fetchWithTimeout'

describe('community fetch boundary', () => {
  it('forbids HTTP redirects so a fixed registry cannot escape to another origin', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.redirect).toBe('error')
      return new Response('{}', { status: 200 })
    }) as unknown as typeof fetch
    await expect(fetchWithTimeout('https://registry.example/registry/v1/index.json', {}, fetcher)).resolves.toBeInstanceOf(Response)
  })
})
