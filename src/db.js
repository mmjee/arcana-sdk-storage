import Dexie from 'dexie'

export const DB = new Dexie('_arcana_storage')
DB.version(1).stores({
  uploads: '++did'
})

// { did: DID, key: the key in hexadecimal format }
export function addUploadToLocalDB (obj) {
  return DB.uploads.add(obj)
}

export function getUploadByDID (did) {
  return DB.uploads.get(did)
}
