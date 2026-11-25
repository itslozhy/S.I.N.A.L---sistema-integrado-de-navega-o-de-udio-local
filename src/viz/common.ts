/** Tudo que um estilo de visualizador recebe a cada quadro */
export interface Frame {
  ctx: CanvasRenderingContext2D
  w: number
  h: number
  /** pixels reais por pixel CSS (telas retina = 2) */
  dpr: number
  freq: Uint8Array
  wave: Uint8Array
  /** energia 0..1 em cada faixa */
  bass: number
  mids: number
  highs: number
  t: number
  colors: { bg: string; a1: string; a2: string; a3: string }
  /** memória livre do estilo entre quadros (partículas etc.) */
  state: Record<string, unknown>
}

export type DrawFn = (f: Frame) => void

/** Índice de frequência em escala quase logarítmica: graves ganham mais espaço */
export const logBin = (i: number, n: number, bins: number) => Math.floor(Math.pow(i / n, 2) * (bins * 0.7)) + 1

export function fade(f: Frame, alpha: number) {
  f.ctx.globalAlpha = alpha
  f.ctx.fillStyle = f.colors.bg
  f.ctx.fillRect(0, 0, f.w, f.h)
  f.ctx.globalAlpha = 1
}
