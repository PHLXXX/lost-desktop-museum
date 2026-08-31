interface HistoryEntry<T> { before: T; after: T; key: string; timestamp: number }

export class HistoryStore<T> {
  private undoStack: HistoryEntry<T>[] = []
  private redoStack: HistoryEntry<T>[] = []
  constructor(private limit = 80, private coalesceMs = 600) {}
  get size() { return this.undoStack.length }
  get canUndo() { return this.undoStack.length > 0 }
  get canRedo() { return this.redoStack.length > 0 }

  record(before: T, after: T, key = 'change', timestamp = Date.now()) {
    const previous = this.undoStack.at(-1)
    if (previous && previous.key === key && timestamp - previous.timestamp <= this.coalesceMs) {
      previous.after = structuredClone(after)
      previous.timestamp = timestamp
    } else {
      this.undoStack.push({ before: structuredClone(before), after: structuredClone(after), key, timestamp })
      if (this.undoStack.length > this.limit) this.undoStack.shift()
    }
    this.redoStack = []
  }

  undo(current: T): T {
    const entry = this.undoStack.pop()
    if (!entry) return current
    this.redoStack.push(entry)
    return structuredClone(entry.before)
  }

  redo(current: T): T {
    const entry = this.redoStack.pop()
    if (!entry) return current
    this.undoStack.push(entry)
    return structuredClone(entry.after)
  }
  clear() { this.undoStack = []; this.redoStack = [] }
}

