/**
 * Banco local de músicas usando IndexedDB (nativo do navegador).
 * Diferente do localStorage, o IndexedDB guarda arquivos binários grandes (Blobs),
 * então os MP3 sobrevivem a recarregar a página e fechar o navegador.
 */
import type { StoredTrack } from '../types'

const DB_NAME = 'sinal'
const DB_VERSION = 1
const STORE = 'tracks'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      // roda só na primeira vez (ou quando DB_VERSION aumentar)
      req.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

/** Executa uma operação e espera a transação terminar de verdade */
async function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = op(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function loadTracks(): Promise<StoredTrack[]> {
  const all = await run('readonly', (s) => s.getAll() as IDBRequest<StoredTrack[]>)
  return all.sort((a, b) => a.addedAt - b.addedAt)
}

export const saveTrack = (t: StoredTrack) => run('readwrite', (s) => s.put(t))

export const deleteTrack = (id: string) => run('readwrite', (s) => s.delete(id))

/** Pede ao navegador para não apagar os dados quando faltar espaço */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) {
      await navigator.storage.persist()
    }
  } catch {
    // navegador sem suporte: tudo bem, os dados continuam salvos
  }
}
