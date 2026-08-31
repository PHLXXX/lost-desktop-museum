async function hashMainThread(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}
export async function calculatePackageSha256(bytes: Uint8Array): Promise<string> {
  if (typeof Worker === 'undefined') return hashMainThread(bytes)
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../../workers/packageHash.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<{ hash?: string; error?: string }>) => { worker.terminate(); if (event.data.hash) resolve(event.data.hash); else reject(new Error(event.data.error ?? '哈希Worker失败。')) }
    worker.onerror = () => { worker.terminate(); void hashMainThread(bytes).then(resolve, reject) }
    const copy = bytes.slice().buffer; worker.postMessage(copy, [copy])
  })
}
export async function verifyPackageIntegrity(bytes: Uint8Array, expectedSha256: string, expectedBytes: number) {
  if (bytes.length !== expectedBytes) throw new Error(`案件包大小不匹配：登记 ${expectedBytes}，实际 ${bytes.length}。`)
  const actual = await calculatePackageSha256(bytes)
  if (actual !== expectedSha256.toLowerCase()) throw new Error('案件包 SHA-256 与社区登记值不匹配，已拒绝安装。')
  return actual
}
