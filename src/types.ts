export type Station = 'grunge' | 'indie' | 'shoegaze' | 'postpunk' | 'vocaloid'

/** Como a música fica guardada no IndexedDB */
export interface StoredTrack {
  id: string
  title: string
  artist: string
  station: Station
  /** o próprio arquivo de áudio */
  blob: Blob
  addedAt: number
}

/** Música carregada na memória, pronta para tocar */
export interface Track extends Omit<StoredTrack, 'blob'> {
  url: string
  size: number
}

export interface HistoryEntry {
  track: Track
  at: Date
}
