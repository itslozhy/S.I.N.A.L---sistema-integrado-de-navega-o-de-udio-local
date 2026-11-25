import { logBin, type DrawFn } from './common'

/**
 * Espectrograma "cachoeira": cada quadro empurra a imagem 2px para cima
 * e desenha uma nova linha embaixo — o tempo corre de baixo para cima.
 * As linhas de varredura de TV antiga ficam no CSS (.stage::after).
 */
export const drawPostPunk: DrawFn = (f) => {
  const { ctx, w, h, freq, colors } = f
  const c = ctx.canvas
  const row = 2
  const shift = row * f.dpr

  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.drawImage(c, 0, shift, c.width, c.height - shift, 0, 0, c.width, c.height - shift)
  ctx.restore()

  ctx.fillStyle = colors.bg
  ctx.fillRect(0, h - row, w, row)
  const cols = 120
  const cw = w / cols
  for (let i = 0; i < cols; i++) {
    const v = freq[logBin(i, cols, freq.length)] / 255
    if (v < 0.05) continue
    ctx.globalAlpha = Math.pow(v, 1.6)
    ctx.fillStyle = v > 0.72 ? colors.a1 : colors.a2
    ctx.fillRect(i * cw, h - row, cw + 0.5, row)
  }
  ctx.globalAlpha = 1
}
