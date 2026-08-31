export function communityErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') return '操作已取消。'
  const message = error instanceof Error ? error.message.trim() : ''
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(message)) return '网络连接失败，请检查连接后重试。'
  if (/timeout|timed out|超时/i.test(message)) return '连接超时，请稍后重试。'
  if (/quota|storage|空间不足/i.test(message)) return '本地存储空间不足，请清理空间后重试。'
  if (/[\u3400-\u9fff]/.test(message)) return message
  return '网络请求失败，请稍后重试。'
}
