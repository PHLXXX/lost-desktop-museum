self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  try {
    const digest = await crypto.subtle.digest('SHA-256', event.data)
    const hash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
    self.postMessage({ hash })
  } catch {
    self.postMessage({ error: 'HASH_FAILED' })
  }
}
