import { fade, logBin, type DrawFn } from './common'

interface Particle {
  x: number
  y: number
  vy: number
  life: number
  alt: boolean
}

/** Anel neon radial com brilho, círculo interno deformado pela onda e partículas */
export const drawVocaloid: DrawFn = (f) => {
  const { ctx, w, h, freq, wave, bass, highs, t, colors } = f
  fade(f, 0.35)

  const cx = w / 2
  const cy = h / 2
  const base = Math.min(w, h) * 0.2 * (1 + bass * 0.25)
  const n = 96
  ctx.lineCap = 'round'
  ctx.shadowBlur = 16
  for (let i = 0; i < n; i++) {
    const mi = i < n / 2 ? i : n - i
    const v = freq[logBin(mi, n / 2, freq.length)] / 255
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2 + t * 0.002
    const len = 4 + v * Math.min(w, h) * 0.28
    const color = i % 2 ? colors.a1 : colors.a2
    ctx.strokeStyle = color
    ctx.shadowColor = color
    ctx.lineWidth = Math.max(2, ((Math.PI * 2 * base) / n) * 0.5)
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(ang) * base, cy + Math.sin(ang) * base)
    ctx.lineTo(cx + Math.cos(ang) * (base + len), cy + Math.sin(ang) * (base + len))
    ctx.stroke()
  }

  ctx.strokeStyle = colors.a1
  ctx.shadowColor = colors.a1
  ctx.lineWidth = 2
  ctx.beginPath()
  const pts = 120
  for (let i = 0; i <= pts; i++) {
    const s = wave[Math.floor(((i % pts) / pts) * wave.length)] / 128 - 1
    const r = base * 0.82 + s * base * 0.35
    const ang = (i / pts) * Math.PI * 2
    if (i === 0) ctx.moveTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r)
    else ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r)
  }
  ctx.stroke()
  ctx.shadowBlur = 0

  const ps = (f.state.particles ??= []) as Particle[]
  if (Math.random() < highs * 3) ps.push({ x: Math.random() * w, y: h + 5, vy: 0.6 + Math.random() * 1.6, life: 1, alt: Math.random() > 0.5 })
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]
    p.y -= p.vy
    p.life -= 0.006
    if (p.life <= 0) {
      ps.splice(i, 1)
      continue
    }
    ctx.globalAlpha = p.life
    ctx.fillStyle = p.alt ? colors.a1 : colors.a2
    ctx.fillRect(p.x, p.y, 2.5, 2.5)
  }
  ctx.globalAlpha = 1
}
