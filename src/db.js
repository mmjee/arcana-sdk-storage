import Dexie from 'dexie'

export const DB = new Dexie('_arcana_storage')
DB.version(1).stores({
  uploads: '++skylink'
})

// { skylink: Skylink, key: the key in hexadecimal format }
export function addUploadToLocalDB (obj) {
  return DB.uploads.add(obj)
}

export function getUploadBySkylink (sl) {
  return DB.get(sl)
}
