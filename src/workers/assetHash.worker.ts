self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  const digest = await crypto.subtle.digest('SHA-256', event.data)
  self.postMessage([...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join(''))
}

export {}
