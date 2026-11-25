import { useEffect, useRef } from 'react'
import type { Station } from '../types'
import type { DrawFn, Frame } from '../viz/common'
import { drawGrunge } from '../viz/grunge'
import { drawIndie } from '../viz/indie'
import { drawPostPunk } from '../viz/postpunk'
import { drawShoegaze } from '../viz/shoegaze'
import { drawVocaloid } from '../viz/vocaloid'

const STYLES: Record<Station, DrawFn> = {
  grunge: drawGrunge,
  indie: drawIndie,
  shoegaze: drawShoegaze,
  postpunk: drawPostPunk,
  vocaloid: drawVocaloid,
}

interface Props {
  analyser: AnalyserNode | null
  station: Station
}

/** Canvas que lê o áudio a cada quadro e delega o desenho ao estilo da estação */
export function Visualizer({ analyser, station }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stationRef = useRef(station)
  useEffect(() => {
    stationRef.current = station
  }, [station])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let w = 0
    let h = 0
    let dpr = 1

    const resize = () => {
      dpr = window.devicePixelRatio || 1
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const bins = analyser?.frequencyBinCount ?? 1024
    const freq = new Uint8Array(bins)
    const wave = new Uint8Array(bins).fill(128)
    const states: Partial<Record<Station, Record<string, unknown>>> = {}
    let lastStation: Station | null = null
    let t = 0

    const avg = (a: number, b: number) => {
      let s = 0
      for (let i = a; i < b; i++) s += freq[i]
      return s / (b - a) / 255
    }

    const draw = () => {
      t++
      if (analyser) {
        analyser.getByteFrequencyData(freq)
        analyser.getByteTimeDomainData(wave)
      }
      const station = stationRef.current
      const css = getComputedStyle(canvas)
      const v = (name: string) => css.getPropertyValue(name).trim()
      const colors = { bg: v('--viz-bg'), a1: v('--accent'), a2: v('--accent-2'), a3: v('--accent-3') || v('--accent') }

      // troca de estação: limpa o rastro do estilo anterior
      if (station !== lastStation) {
        ctx.fillStyle = colors.bg
        ctx.fillRect(0, 0, w, h)
        lastStation = station
      }

      const frame: Frame = {
        ctx, w, h, dpr, freq, wave, t, colors,
        bass: avg(1, 12),
        mids: avg(12, 120),
        highs: avg(120, 400),
        state: (states[station] ??= {}),
      }
      ctx.save()
      STYLES[station](frame)
      ctx.restore()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [analyser])

  return <canvas ref={canvasRef} className="visualizer" aria-label="Visualizador de áudio" />
}
