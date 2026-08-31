import { fetchWithTimeout } from './fetchWithTimeout'

export interface DownloadProgress { downloadedBytes: number; totalBytes: number | null; percent: number | null }
export async function downloadCasePackage(url: string, options: { signal: AbortSignal; expectedBytes: number; onProgress?: (value: DownloadProgress) => void; fetcher?: typeof fetch }): Promise<Uint8Array> {
  const response = await fetchWithTimeout(url, { signal: options.signal, timeoutMs: 30_000 }, options.fetcher)
  if (!response.ok) throw new Error(`案件包下载失败（HTTP ${response.status}）。`)
  const headerSize = Number(response.headers.get('content-length')); const totalBytes = Number.isFinite(headerSize) && headerSize > 0 ? headerSize : null
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer()); options.onProgress?.({ downloadedBytes: bytes.length, totalBytes: null, percent: null }); return bytes
  }
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let downloadedBytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break
      chunks.push(value); downloadedBytes += value.length
      if (downloadedBytes > Math.max(options.expectedBytes, totalBytes ?? 0) + 1024) throw new Error('下载内容超过登记大小，已中止。')
      options.onProgress?.({ downloadedBytes, totalBytes, percent: totalBytes ? Math.min(100, Math.round(downloadedBytes / totalBytes * 100)) : null })
    }
  } catch (error) { await reader.cancel(); if (options.signal.aborted) throw new DOMException('下载已取消。', 'AbortError'); throw error }
  const bytes = new Uint8Array(downloadedBytes); let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  return bytes
}
