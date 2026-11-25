import { fade, logBin, type DrawFn } from './common'

/** Barras rasgadas, waveform rabiscada, granulado de xerox e glitch nos graves */
export const drawGrunge: DrawFn = (f) => {
  const { ctx, w, h, freq, wave, bass, t, colors } = f
  fade(f, 0.55)

  const n = 40
  const gap = w / n
  for (let i = 0; i < n; i++) {
    const v = freq[logBin(i, n, freq.length)] / 255
    const bh = Math.max(3, v * h * 0.85)
    const x = i * gap + gap * 0.15 + (Math.random() - 0.5) * 3 * v
    const bw = gap * (0.55 + Math.random() * 0.15)
    ctx.globalAlpha = 0.85
    ctx.fillStyle = colors.a1
    ctx.fillRect(x, h - bh, bw, bh)
    ctx.fillStyle = colors.bg
    for (let k = 0; k < 3; k++) ctx.fillRect(x, h - Math.random() * bh, bw, 1 + Math.random() * 2)
  }
  ctx.globalAlpha = 1

  ctx.strokeStyle = colors.a2
  ctx.lineWidth = 2.5
  ctx.beginPath()
  const step = Math.ceil(wave.length / 180)
  for (let i = 0; i < wave.length; i += step) {
    const x = (i / wave.length) * w
    const y = (wave[i] / 255) * h * 0.6 + h * 0.2 + (Math.random() - 0.5) * 2
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  ctx.fillStyle = 'rgba(232,220,196,0.18)'
  for (let i = 0; i < 260; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5)

  if (bass > 0.62 && t % 2 === 0) {
    const c = ctx.canvas
    for (let k = 0; k < 3; k++) {
      const y = Math.random() * h
      const sh = 6 + Math.random() * 24
      ctx.drawImage(c, 0, y * f.dpr, c.width, sh * f.dpr, (Math.random() - 0.5) * 40 * bass, y, w, sh)
    }
  }
}
