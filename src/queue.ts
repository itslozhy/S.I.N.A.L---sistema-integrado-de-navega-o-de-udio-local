import { STATIONS } from './stations'
import type { Station, Track } from './types'

/**
 * Monta a fila intercalando as estações selecionadas:
 * grunge, indie, shoegaze, grunge, indie, shoegaze…
 * Estações com menos faixas recomeçam do início para manter o rodízio.
 */
export function buildQueue(tracks: Track[], selected: Station[]): Track[] {
  const groups = STATIONS.filter((s) => selected.includes(s.id))
    .map((s) => tracks.filter((t) => t.station === s.id))
    .filter((g) => g.length > 0)
  if (!groups.length) return []
  const n = Math.max(...groups.map((g) => g.length))
  const out: Track[] = []
  for (let i = 0; i < n; i++) for (const g of groups) out.push(g[i % g.length])
  return out
}
