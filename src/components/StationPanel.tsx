import { useState, type CSSProperties } from 'react'
import type { StationDef } from '../stations'
import type { Station, Track } from '../types'

interface Props {
  station: StationDef
  tracks: Track[]
  currentId: string | null
  /** estação está ligada no seletor? */
  active: boolean
  onPlay: (t: Track) => void
  onAddFiles: (files: FileList, station: Station) => void
  onRemove: (t: Track) => void
}

export function StationPanel({ station, tracks, currentId, active, onPlay, onAddFiles, onRemove }: Props) {
  const [dragging, setDragging] = useState(false)

  return (
    <section
      className={`panel station-panel ${dragging ? 'dragging' : ''} ${active ? '' : 'off'}`}
      style={{ '--chip': station.color } as CSSProperties}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files.length) onAddFiles(e.dataTransfer.files, station.id)
      }}
    >
      <header className="panel-head">
        <div>
          <h2 style={{ fontFamily: station.font, color: station.color }}>{station.name}</h2>
          <small>
            {station.freq} — {station.place}
          </small>
        </div>
        <label className="btn btn-small" title={`Adicionar músicas em ${station.name}`}>
          + Adicionar
          <input
            type="file"
            accept="audio/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) onAddFiles(e.target.files, station.id)
              e.target.value = ''
            }}
          />
        </label>
      </header>

      {tracks.length === 0 && <p className="empty">Nenhuma música nesta estação ainda.</p>}
      <ol className="tracklist">
        {tracks.map((t) => (
          <li key={t.id} className={t.id === currentId ? 'active' : ''}>
            <button className="track" onClick={() => onPlay(t)}>
              <span className="track-title">{t.title}</span>
              <span className="track-artist">{t.artist}</span>
            </button>
            <button className="remove" title="Remover" aria-label={`Remover ${t.title}`} onClick={() => onRemove(t)}>
              ×
            </button>
          </li>
        ))}
      </ol>
      <p className="drop-hint">Arraste arquivos de áudio para cá</p>
    </section>
  )
}
