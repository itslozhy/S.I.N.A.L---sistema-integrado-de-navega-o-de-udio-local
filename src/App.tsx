import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Visualizer } from './components/Visualizer'
import { StationPanel } from './components/StationPanel'
import { buildQueue } from './queue'
import { STATIONS, STATION_BY_ID } from './stations'
import { deleteTrack, loadTracks, requestPersistence, saveTrack } from './storage/db'
import type { HistoryEntry, Station, StoredTrack, Track } from './types'
import './App.css'

const ALL: Station[] = STATIONS.map((s) => s.id)
const PREFS_KEY = 'sinal:prefs'

const fmtTime = (s: number) => {
  if (!isFinite(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}
const fmtSize = (bytes: number) => (bytes > 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`)

/** "Artista - Título.mp3" vira { artist, title }; senão usa o nome do arquivo como título */
function parseFileName(name: string) {
  const base = name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim()
  const m = base.match(/^(.+?)\s+[-–]\s+(.+)$/)
  return m ? { artist: m[1].trim(), title: m[2].trim() } : { artist: 'Artista desconhecido', title: base }
}

const toTrack = (s: StoredTrack): Track => ({
  id: s.id,
  title: s.title,
  artist: s.artist,
  station: s.station,
  addedAt: s.addedAt,
  size: s.blob.size,
  url: URL.createObjectURL(s.blob),
})

/** Preferências leves (estações ligadas, volume) ficam no localStorage */
function readPrefs(): { selected: Station[]; volume: number } {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
    const selected = Array.isArray(p.selected) ? ALL.filter((s) => p.selected.includes(s)) : ALL
    return { selected: selected.length ? selected : ALL, volume: typeof p.volume === 'number' ? p.volume : 0.8 }
  } catch {
    return { selected: ALL, volume: 0.8 }
  }
}

export default function App() {
  const [prefs] = useState(readPrefs)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loaded, setLoaded] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [selected, setSelected] = useState<Station[]>(prefs.selected)
  const [current, setCurrent] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(prefs.volume)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const posRef = useRef(-1) // posição atual na fila

  const queue = useMemo(() => buildQueue(tracks, selected), [tracks, selected])
  const totalSize = useMemo(() => tracks.reduce((n, t) => n + t.size, 0), [tracks])

  // carrega a biblioteca salva ao abrir
  useEffect(() => {
    loadTracks()
      .then((stored) => setTracks(stored.map(toTrack)))
      .catch(() => setNotice('Não foi possível abrir a biblioteca salva neste navegador.'))
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ selected, volume }))
    } catch {
      // modo anônimo etc.: só não lembra as preferências
    }
  }, [selected, volume])

  // ao mudar as estações, reposiciona a fila na faixa atual
  useEffect(() => {
    posRef.current = current ? queue.findIndex((t) => t.id === current.id) : -1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  /** O AudioContext só pode nascer depois de um clique do usuário (política de autoplay) */
  const ensureGraph = () => {
    if (ctxRef.current) {
      void ctxRef.current.resume()
      return
    }
    const ctx = new AudioContext()
    const src = ctx.createMediaElementSource(audioRef.current!)
    const an = ctx.createAnalyser()
    an.fftSize = 2048
    an.smoothingTimeConstant = 0.78
    src.connect(an).connect(ctx.destination)
    ctxRef.current = ctx
    setAnalyser(an)
  }

  const playTrack = useCallback(
    (track: Track, pos?: number) => {
      ensureGraph()
      const audio = audioRef.current!
      posRef.current = pos ?? queue.findIndex((t) => t.id === track.id)
      setCurrent(track)
      setTime(0)
      audio.src = track.url
      // AbortError = o usuário trocou de faixa antes desta começar; pode ignorar
      audio.play().catch((e: DOMException) => {
        if (e.name === 'NotSupportedError') setNotice(`O navegador não conseguiu tocar "${track.title}". Formato não suportado?`)
        else if (e.name !== 'AbortError') console.error(e)
      })
      setHistory((h) => [{ track, at: new Date() }, ...h].slice(0, 12))
    },
    [queue],
  )

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!queue.length) return
      const next = (posRef.current + dir + queue.length) % queue.length
      playTrack(queue[next], next)
    },
    [queue, playTrack],
  )

  const togglePlay = useCallback(() => {
    const audio = audioRef.current!
    if (!current) {
      if (queue.length) playTrack(queue[0], 0)
      return
    }
    ensureGraph()
    if (audio.paused) void audio.play()
    else audio.pause()
  }, [current, queue, playTrack])

  // atalhos: espaço = play/pause, ← → = anterior/próxima
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'ArrowRight') step(1)
      else if (e.code === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, step])

  const toggleStation = (id: Station) => {
    setSelected((sel) => {
      if (sel.includes(id)) return sel.length > 1 ? sel.filter((s) => s !== id) : sel // mantém pelo menos uma
      return ALL.filter((s) => s === id || sel.includes(s))
    })
  }

  const addFiles = async (files: FileList, station: Station) => {
    const audioFiles = [...files].filter((f) => f.type.startsWith('audio/'))
    const skipped = files.length - audioFiles.length
    const added: Track[] = []
    for (const [i, f] of audioFiles.entries()) {
      const stored: StoredTrack = {
        id: crypto.randomUUID(),
        ...parseFileName(f.name),
        station,
        blob: f,
        addedAt: Date.now() + i,
      }
      try {
        await saveTrack(stored)
        added.push(toTrack(stored))
      } catch (e) {
        const full = e instanceof DOMException && e.name === 'QuotaExceededError'
        setNotice(full ? 'Sem espaço no navegador para salvar mais músicas.' : `Não foi possível salvar "${f.name}".`)
        break
      }
    }
    if (added.length) {
      setTracks((prev) => [...prev, ...added])
      void requestPersistence()
    }
    if (skipped > 0) setNotice(`${skipped} arquivo(s) ignorado(s): não são de áudio.`)
  }

  const removeTrack = async (t: Track) => {
    if (!confirm(`Remover "${t.title}" da biblioteca?`)) return
    await deleteTrack(t.id)
    if (current?.id === t.id) {
      audioRef.current!.pause()
      audioRef.current!.removeAttribute('src')
      setCurrent(null)
    }
    URL.revokeObjectURL(t.url)
    setTracks((prev) => prev.filter((x) => x.id !== t.id))
  }

  // o tema segue a faixa tocando; sem faixa, a primeira estação ligada
  const station: Station = current?.station ?? selected[0]
  const def = STATION_BY_ID[station]
  const allOn = selected.length === ALL.length
  const empty = loaded && tracks.length === 0

  return (
    <div className="app" data-station={station}>
      <header className="top">
        <div>
          <h1 className="logo">S.I.N.A.L.</h1>
          <p className="tagline">Sistema Integrado de Navegação de Áudio Local</p>
        </div>
        <div className={`on-air ${playing ? 'live' : ''}`}>
          <span className="dot" /> {playing ? 'NO AR' : 'FORA DO AR'}
        </div>
      </header>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Fechar aviso">×</button>
        </div>
      )}

      <nav className="dial" aria-label="Estações">
        <button className={`chip ${allOn ? 'on' : ''}`} onClick={() => setSelected(ALL)} aria-pressed={allOn}>
          Todas
        </button>
        {STATIONS.map((s) => {
          const on = selected.includes(s.id)
          return (
            <button
              key={s.id}
              className={`chip ${on ? 'on' : ''}`}
              style={{ '--chip': s.color, fontFamily: s.font } as CSSProperties}
              onClick={() => toggleStation(s.id)}
              aria-pressed={on}
            >
              <span className="chip-freq">{s.freq.replace('FM ', '')}</span> {s.name}
            </button>
          )
        })}
      </nav>

      <main className="stage">
        <Visualizer analyser={analyser} station={station} />
        <div className="now-playing">
          {current ? (
            <>
              <p className="np-station">
                {def.freq} · {def.name.toUpperCase()}
              </p>
              <p className="np-title">{current.title}</p>
              <p className="np-artist">{current.artist}</p>
            </>
          ) : empty ? (
            <>
              <p className="np-title">Nenhum sinal ainda</p>
              <p className="np-artist">Adicione suas músicas numa das estações abaixo: botão “+ Adicionar” ou arraste os arquivos.</p>
            </>
          ) : queue.length === 0 && loaded ? (
            <>
              <p className="np-title">Estação vazia</p>
              <p className="np-artist">Nenhuma música nas estações ligadas. Ligue outra estação ou adicione músicas.</p>
            </>
          ) : (
            <p className="np-title">{loaded ? 'Aperte play para sintonizar' : 'Carregando biblioteca…'}</p>
          )}
        </div>
      </main>

      <section className="controls">
        <div className="buttons">
          <button className="btn" onClick={() => step(-1)} aria-label="Anterior" disabled={!queue.length}>⏮</button>
          <button className="btn btn-play" onClick={togglePlay} aria-label={playing ? 'Pausar' : 'Tocar'} disabled={!queue.length && !current}>
            {playing ? '❚❚' : '▶'}
          </button>
          <button className="btn" onClick={() => step(1)} aria-label="Próxima" disabled={!queue.length}>⏭</button>
        </div>
        <div className="progress">
          <span>{fmtTime(time)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            onChange={(e) => (audioRef.current!.currentTime = Number(e.target.value))}
            aria-label="Posição da música"
          />
          <span>{fmtTime(duration)}</span>
        </div>
        <label className="volume">
          🔊
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume" />
        </label>
      </section>

      <div className="panels">
        {STATIONS.map((s) => (
          <StationPanel
            key={s.id}
            station={s}
            active={selected.includes(s.id)}
            tracks={tracks.filter((t) => t.station === s.id)}
            currentId={current?.id ?? null}
            onPlay={(t) => playTrack(t)}
            onAddFiles={(f, st) => void addFiles(f, st)}
            onRemove={(t) => void removeTrack(t)}
          />
        ))}
      </div>

      <section className="panel history">
        <h2>Tocou recentemente</h2>
        {history.length === 0 ? (
          <p className="muted">Nada ainda. Só estática por enquanto.</p>
        ) : (
          <ul>
            {history.map((h, i) => {
              const s = STATION_BY_ID[h.track.station]
              return (
                <li key={i}>
                  <time>{h.at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
                  <span>{h.track.title}</span>
                  <small style={{ color: s.color }}>{s.name}</small>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <footer className="foot">
        <p>
          {tracks.length} {tracks.length === 1 ? 'música salva' : 'músicas salvas'} neste navegador · {fmtSize(totalSize)}
        </p>
        <p>
          Atalhos: <kbd>espaço</kbd> play/pause · <kbd>←</kbd> <kbd>→</kbd> trocar faixa
        </p>
      </footer>

      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => step(1)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
    </div>
  )
}
