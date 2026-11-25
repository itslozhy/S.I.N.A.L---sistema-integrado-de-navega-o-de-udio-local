import { fade, type DrawFn, type Frame } from './common'

const band = (f: Frame, a: number, b: number) => {
  let s = 0
  for (let i = a; i < b; i++) s += f.freq[i]
  return s / (b - a) / 255
}

/** Névoa: faixas grossas de cor ondulando, borradas e com rastro longo */
export const drawShoegaze: DrawFn = (f) => {
  const { ctx, w, h, t, colors } = f
  fade(f, 0.1)

  const layers = [
    { e: band(f, 1, 10), c: colors.a1, y: 0.7 },
    { e: band(f, 10, 40), c: colors.a2, y: 0.55 },
    { e: band(f, 40, 120), c: colors.a3, y: 0.4 },
    { e: band(f, 120, 300), c: colors.a1, y: 0.28 },
  ]
  ctx.filter = 'blur(14px)'
  ctx.lineCap = 'round'
  layers.forEach((l, k) => {
    ctx.strokeStyle = l.c
    ctx.globalAlpha = 0.25 + l.e * 0.5
    ctx.lineWidth = 14 + l.e * 60
    ctx.beginPath()
    for (let x = -20; x <= w + 20; x += 16) {
      const y =
        h * l.y +
        Math.sin(x * 0.006 + t * 0.012 * (k + 1)) * (16 + l.e * h * 0.22) +
        Math.sin(x * 0.017 - t * 0.02) * 8
      if (x < 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  })
  ctx.filter = 'none'
  ctx.globalAlpha = 1

  // poeira brilhante flutuando
  ctx.fillStyle = colors.a3
  for (let i = 0; i < 6; i++) {
    ctx.globalAlpha = Math.random() * 0.5 * (0.3 + f.highs * 3)
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
  }
  ctx.globalAlpha = 1
}
