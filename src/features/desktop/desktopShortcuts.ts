export function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null
  return Boolean(element?.closest('input, textarea, select, [contenteditable="true"]'))
}

export function isSaveShortcut(event: KeyboardEvent) {
  return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's'
}
