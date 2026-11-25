import type { Station } from './types'

export interface StationDef {
  id: Station
  name: string
  freq: string
  place: string
  /** cor de destaque usada em chips, títulos e histórico */
  color: string
  font: string
}

/**
 * Registro central das estações. Cada música que o usuário adiciona pertence a uma delas.
 * O tema completo (fundo, painéis…) fica no App.css em [data-station='id']
 * e o visualizador correspondente em src/viz/.
 *
 * Na versão física (ESP32), cada estação vira uma pasta no cartão SD: /grunge, /indie…
 */
export const STATIONS: StationDef[] = [
  {
    id: 'grunge',
    name: 'Grunge',
    freq: 'FM 91.1',
    place: 'Seattle, 1991',
    color: '#c8a165',
    font: "'Special Elite', monospace",
  },
  {
    id: 'indie',
    name: 'Indie Rock',
    freq: 'FM 101.3',
    place: 'Sheffield, 2006',
    color: '#e8e2d6',
    font: "'Bebas Neue', sans-serif",
  },
  {
    id: 'shoegaze',
    name: 'Shoegaze',
    freq: 'FM 88.8',
    place: 'Londres, 1991',
    color: '#f4a6c8',
    font: "'Cormorant Garamond', serif",
  },
  {
    id: 'postpunk',
    name: 'Post-Punk',
    freq: 'FM 77.9',
    place: 'Manchester, 1979',
    color: '#9fb6c9',
    font: "'IBM Plex Mono', monospace",
  },
  {
    id: 'vocaloid',
    name: 'Vocaloid',
    freq: 'FM 39.0',
    place: 'Tóquio, 2007',
    color: '#39c5bb',
    font: "'Orbitron', sans-serif",
  },
]

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s])) as Record<Station, StationDef>
