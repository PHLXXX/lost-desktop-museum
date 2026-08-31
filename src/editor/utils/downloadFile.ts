export function downloadFile(filename: string, bytes: Uint8Array, mime = 'application/zip') {
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: mime }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
