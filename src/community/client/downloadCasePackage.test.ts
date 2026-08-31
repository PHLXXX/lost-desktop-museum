import { describe, expect, it, vi } from 'vitest'
import { downloadCasePackage } from './downloadCasePackage'

describe('community package download', () => {
  it('supports cancellation through AbortController', async () => {
    const controller = new AbortController()
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')), { once: true })
    })) as unknown as typeof fetch
    const pending = downloadCasePackage('https://registry.example/packages/case.ldmcase', { signal: controller.signal, expectedBytes: 4, fetcher })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('reports real streamed bytes and stops an oversized response', async () => {
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(2_050)); controller.close() } })
    const fetcher = vi.fn(async () => new Response(body, { status: 200 })) as unknown as typeof fetch
    await expect(downloadCasePackage('https://registry.example/packages/case.ldmcase', { signal: new AbortController().signal, expectedBytes: 1_000, fetcher })).rejects.toThrow(/超过登记大小/)
  })

  it('localizes a browser network failure', async () => {
    const fetcher = vi.fn(async () => { throw new TypeError('Failed to fetch') }) as unknown as typeof fetch

    await expect(downloadCasePackage('https://registry.example/packages/case.ldmcase', {
      signal: new AbortController().signal,
      expectedBytes: 1_000,
      fetcher,
    })).rejects.toThrow('网络连接失败，请检查连接后重试。')
  })
})
