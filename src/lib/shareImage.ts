import { categoryFor } from '../data/icons'
import { DAY_MAX, roundTone, scoreDay } from '../game/scoring'
import type { DayRecord, Mark, PuzzleSet } from '../game/types'

/** Same palette as the CSS tokens, fixed so the image looks the same in either theme. */
const C = {
  hero: '#0f4f4c',
  heroDeep: '#0a3b39',
  glow: '#45683f',
  ink: '#fdf8ec',
  pop: '#ffc53d',
  hit: '#3fb37f',
  near: '#f2b134',
  miss: '#ef6a5b',
}
const MARK: Record<Mark, string> = { hit: C.hit, near: C.near, miss: C.miss }
const FONT = "'Bricolage Grotesque Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

export const CARD_W = 1080
export const CARD_H = 1080

/** The mascot from Bird.tsx, drawn at (x, y) = top-left of its 46-unit box. */
function bird(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, body: string, crown: boolean) {
  ctx.save()
  ctx.translate(x, y + 8 * scale)
  ctx.scale(scale, scale)
  if (crown) {
    ctx.fillStyle = C.pop
    ctx.fill(new Path2D('M24.5 4.5 23 -5l4.5 4 3.5-5.5 3.5 5.5 4.5-4-1.5 9.5z'))
  }
  ctx.fillStyle = body
  ctx.fill(new Path2D('M9 22 1 14.5h11z'))
  ctx.beginPath()
  ctx.ellipse(21, 22, 13, 11, 0, 0, Math.PI * 2)
  ctx.arc(31, 13, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.beginPath()
  ctx.ellipse(23, 25.5, 8, 5.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = C.pop
  ctx.fill(new Path2D('m38 10.5 7 3-7 3z'))
  ctx.fillStyle = C.heroDeep
  ctx.beginPath()
  ctx.arc(33, 11.5, 1.7, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = body
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.stroke(new Path2D('M18 32v6M24.5 32v6'))
  ctx.restore()
}

/** Draws the day's result card: number, score, a bird per round and the colour grid. No answers. */
export function drawShareCard(ctx: CanvasRenderingContext2D, day: number, record: DayRecord, sets: readonly PuzzleSet[], url: string) {
  const W = CARD_W
  const H = CARD_H
  const total = scoreDay(record.rounds)
  const best = Math.max(1, ...record.rounds.map((r) => r.score))

  const bg = ctx.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, W * 1.1)
  bg.addColorStop(0, C.glow)
  bg.addColorStop(0.6, C.hero)
  bg.addColorStop(1, C.heroDeep)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = C.ink
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.font = `800 64px ${FONT}`
  ctx.fillText('Peckish', 72, 128)
  ctx.textAlign = 'right'
  ctx.globalAlpha = 0.8
  ctx.font = `700 40px ${FONT}`
  ctx.fillText(`No. ${day}${record.hard ? '  ·  🔥 Hard' : ''}`, W - 72, 124)
  ctx.globalAlpha = 1

  // A bird per round on the wire, coloured by its score; the best wears the crown.
  const wireY = 330
  ctx.fillStyle = 'rgba(253,248,236,0.5)'
  ctx.fillRect(0, wireY, W, 5)
  const scale = 3.2
  const span = 46 * scale
  const gap = 90
  const startX = (W - (span * 3 + gap * 2)) / 2
  record.rounds.forEach((round, i) => {
    const x = startX + i * (span + gap)
    bird(ctx, x, wireY - 46 * scale + 2, scale, MARK[roundTone(round.score)], round.score === best)
  })

  ctx.fillStyle = C.ink
  ctx.textAlign = 'center'
  ctx.font = `800 200px ${FONT}`
  const scoreText = String(total)
  const scoreW = ctx.measureText(scoreText).width
  ctx.font = `700 64px ${FONT}`
  const maxW = ctx.measureText(`/${DAY_MAX}`).width
  const left = (W - scoreW - maxW) / 2
  ctx.textAlign = 'left'
  ctx.font = `800 200px ${FONT}`
  ctx.fillText(scoreText, left, 560)
  ctx.globalAlpha = 0.7
  ctx.font = `700 64px ${FONT}`
  ctx.fillText(`/${DAY_MAX}`, left + scoreW + 8, 560)
  ctx.globalAlpha = 1

  // One row of five squares per round, with the category and points beside it.
  const cell = 76
  const cellGap = 14
  const rowGap = 34
  const gridX = 96
  let y = 640
  record.rounds.forEach((round, i) => {
    round.marks.forEach((m, j) => {
      ctx.fillStyle = MARK[m]
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(gridX + j * (cell + cellGap), y, cell, cell, 14)
      else ctx.rect(gridX + j * (cell + cellGap), y, cell, cell)
      ctx.fill()
    })
    const set = sets[i]
    const name = set ? categoryFor(set.key)[1] : `Round ${i + 1}`
    ctx.fillStyle = C.ink
    ctx.textAlign = 'left'
    ctx.font = `700 40px ${FONT}`
    const textX = gridX + 5 * (cell + cellGap) + 26
    ctx.fillText(name, textX, y + 36)
    ctx.globalAlpha = 0.75
    ctx.font = `600 32px ${FONT}`
    ctx.fillText(`${round.score} pts${round.first ? ' · 2nd try' : ''}${round.hint ? ' · 💡 hint' : ''}`, textX, y + 72)
    ctx.globalAlpha = 1
    y += cell + rowGap
  })

  ctx.fillStyle = C.pop
  ctx.textAlign = 'center'
  ctx.font = `700 34px ${FONT}`
  ctx.fillText(url.replace(/^https?:\/\//, '').replace(/\/$/, ''), W / 2, H - 52)
}

/** Renders the card to a PNG blob, waiting for the display font so the canvas uses it. */
export async function shareCardBlob(day: number, record: DayRecord, sets: readonly PuzzleSet[], url: string): Promise<Blob | null> {
  try {
    await document.fonts?.ready
  } catch {
    // Fonts API missing or failed; the system fallback is fine.
  }
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  drawShareCard(ctx, day, record, sets, url)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
