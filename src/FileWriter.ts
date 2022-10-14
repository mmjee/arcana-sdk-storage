export default class FileWriter {
  public static deleteDB = async (name: string) => {
    return new Promise((resolve, reject) => {
      const req = window.indexedDB.deleteDatabase(name)
      req.onerror = (event) => {
        return reject(event)
      }
      req.onsuccess = (event) => {
        return resolve(event)
      }
    })
  }

  public writing: boolean = false
  public fileName: string
  private readonly dbName: string
  private readonly type: 'view' | 'download'
  private DB: IDBDatabase
  private count: number = 1000000
  constructor (fileName: string, type: 'view' | 'download' = 'download') {
    this.dbName = String(new Date().getTime())
    this.fileName = fileName
    this.type = type
  }

  public delete () {
    return FileWriter.deleteDB(this.dbName)
  }

  public write (data: ArrayBuffer, c: number) {
    // ???, TODO refactor
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (this.writing) {
        return resolve(undefined)
      }
      this.writing = true
      const self = this
      if (!this.DB) {
        await this.initDB().catch(() => {
          self.initDB()
        })
      }
      const transaction = this.DB.transaction(this.dbName, 'readwrite')
      transaction.oncomplete = () => {
        self.writing = false
        return resolve(true)
      }
      transaction.onerror = () => {
        self.writing = false
        return self.write(data, c).then(resolve).catch(reject)
      }
      transaction.objectStore(self.dbName).put(new Blob([data]), 'chunk' + (self.count + c))
    })
  }

  public createDownload (name?: string): Promise<void | Blob> {
    return new Promise((resolve, reject) => {
      this.writing = true
      const self = this
      const transaction = this.DB.transaction([self.dbName], 'readonly')
      const request = transaction.objectStore(self.dbName).getAll()
      request.onsuccess = (event: any) => {
        const blob = new Blob(event.target.result)
        if (this.type === 'view') {
          return resolve(blob)
        } else {
          const objectUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.download = name || self.fileName
          a.href = objectUrl
          document.body.appendChild(a)
          a.click()
          this.writing = false
          setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(objectUrl)
            return resolve(null)
          }, 100)
        }
      }
      request.onerror = (e: Event) => {
        return reject(e)
      }
    })
  }

  private initDB () {
    return new Promise((resolve, reject) => {
      const self = this
      const request = window.indexedDB.open(this.dbName, 1)
      request.onsuccess = () => {
        self.DB = request.result
        return resolve(undefined)
      }
      request.onerror = (event) => {
        return reject(event)
      }
      request.onupgradeneeded = (event: any) => {
        event.target.result.createObjectStore(self.dbName)
      }
    })
  }
}
