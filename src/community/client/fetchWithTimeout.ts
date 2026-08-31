export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}, fetcher: typeof fetch = fetch) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort('timeout'), init.timeoutMs ?? 12_000)
  const abort = () => controller.abort(init.signal?.reason)
  init.signal?.addEventListener('abort', abort, { once: true })
  try { return await fetcher(input, { redirect: 'error', ...init, signal: controller.signal }) }
  catch (error) { if (controller.signal.aborted && !init.signal?.aborted) throw new Error('社区请求超时，请稍后重试。', { cause: error }); throw error }
  finally { clearTimeout(timeout); init.signal?.removeEventListener('abort', abort) }
}
