import { fade, logBin, type DrawFn } from './common'

/** Palco: holofote pulsando com o bumbo e barras espelhadas a partir do centro */
export const drawIndie: DrawFn = (f) => {
  const { ctx, w, h, freq, bass, colors } = f
  fade(f, 0.5)

  // holofote vindo de cima
  const r = h * (0.7 + bass * 0.8)
  const spot = ctx.createRadialGradient(w / 2, -h * 0.15, 0, w / 2, -h * 0.15, r)
  spot.addColorStop(0, colors.a1)
  spot.addColorStop(1, 'transparent')
  ctx.globalAlpha = 0.06 + bass * 0.16
  ctx.fillStyle = spot
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 1

  const n = 56
  const slot = w / n
  const bw = slot * 0.55
  const cy = h * 0.58
  for (let i = 0; i < n; i++) {
    // espelha: graves no centro, agudos nas pontas
    const mi = Math.abs(i - n / 2 + 0.5)
    const v = freq[logBin(Math.floor(mi), n / 2, freq.length)] / 255
    const bh = 2 + v * h * 0.38
    const x = i * slot + (slot - bw) / 2
    ctx.fillStyle = colors.a1
    ctx.fillRect(x, cy - bh, bw, bh * 1.6)
    ctx.fillStyle = colors.a2
    ctx.fillRect(x, cy - bh - 5, bw, 3)
  }
  ctx.fillStyle = colors.a2
  ctx.fillRect(0, cy, w, 1)
}
