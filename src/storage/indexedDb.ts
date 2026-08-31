export interface KeyValueRepository<T> {
  get(key: string): Promise<T | null>
  set(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  list(): Promise<T[]>
}

export class IndexedDbRepository<T> implements KeyValueRepository<T> {
  constructor(private databaseName: string, private storeName: string, private keyField: string) {}

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, 1)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(this.storeName)) database.createObjectStore(this.storeName, { keyPath: this.keyField })
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('无法打开本地工程存储。'))
    })
  }

  private async request<R>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<R>): Promise<R> {
    const database = await this.open()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(this.storeName, mode)
      const request = operation(transaction.objectStore(this.storeName))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('本地工程存储操作失败。'))
      transaction.oncomplete = () => database.close()
      transaction.onerror = () => reject(transaction.error ?? new Error('本地工程事务失败。'))
    })
  }

  async get(key: string): Promise<T | null> { return (await this.request<T | undefined>('readonly', (store) => store.get(key))) ?? null }
  async set(_key: string, value: T): Promise<void> { await this.request<IDBValidKey>('readwrite', (store) => store.put(value)) }
  async delete(key: string): Promise<void> { await this.request<undefined>('readwrite', (store) => store.delete(key)) }
  async list(): Promise<T[]> { return this.request<T[]>('readonly', (store) => store.getAll()) }
}

