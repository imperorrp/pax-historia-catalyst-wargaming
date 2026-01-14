import type { VisualActionType } from "./types"

export interface DrawingContext {
  ctx: CanvasRenderingContext2D
  from: { x: number; y: number }
  to: { x: number; y: number }
  opacity?: number
}

// Helper: Calculate distance between two points
export const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))

// Helper: Calculate angle between two points
export const angle = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.atan2(b.y - a.y, b.x - a.x)

// Helper: Quadratic Bezier (used for curves)
export const quadraticBezier = (t: number, p0: number, p1: number, p2: number) =>
  (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2

// Helper: Create control point for curved paths
export const getControlPoint = (from: { x: number; y: number }, to: { x: number; y: number }, offset: number) => {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  const ang = angle(from, to)
  const perpAng = ang + Math.PI / 2
  return {
    x: mid.x + offset * Math.cos(perpAng),
    y: mid.y + offset * Math.sin(perpAng),
  }
}

export function drawADVANCE({ ctx, from, to, opacity = 1 }: DrawingContext) {
  const dist = distance(from, to)
  const ang = angle(from, to)

  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#2c3e50"
  ctx.lineWidth = 6
  ctx.fillStyle = "#2c3e50"

  // Draw shadow for depth
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  // Arrowhead
  drawArrowHead(ctx, to, ang, 28, "#2c3e50")
  
  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.globalAlpha = 1
}

// --- HEX ACTIONS ---

export function drawHexPath({ ctx, path, color = "#e74c3c", opacity = 0.8 }: { ctx: CanvasRenderingContext2D, path: {x: number, y: number}[], color?: string, opacity?: number }) {
  if (path.length < 2) return;

  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]); // Dashed line for tactical movement
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  
  ctx.stroke();
  ctx.setLineDash([]); // Reset
  
  // Terminal Arrow
  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  const ang = angle(prev, last);
  drawArrowHead(ctx, last, ang, 15, color);
  
  ctx.globalAlpha = 1;
}


export function drawASSAULT({ ctx, from, to, opacity = 1 }: DrawingContext) {
  const ang = angle(from, to)

  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#c0392b"
  ctx.lineWidth = 7
  ctx.fillStyle = "#c0392b"

  // Add shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)"
  ctx.shadowBlur = 5
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  // Perpendicular "Limit of Advance" bar
  const barLength = 40
  const barX1 = to.x + barLength * Math.cos(ang + Math.PI / 2)
  const barY1 = to.y + barLength * Math.sin(ang + Math.PI / 2)
  const barX2 = to.x + barLength * Math.cos(ang - Math.PI / 2)
  const barY2 = to.y + barLength * Math.sin(ang - Math.PI / 2)

  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(barX1, barY1)
  ctx.lineTo(barX2, barY2)
  ctx.stroke()

  drawArrowHead(ctx, to, ang, 30, "#c0392b")
  
  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.globalAlpha = 1
}

export function drawFLANK_LEFT({ ctx, from, to, opacity = 1 }: DrawingContext) {
  const cp = getControlPoint(from, to, -120)
  const ang = angle(cp, to)

  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#f39c12"
  ctx.lineWidth = 6

  // Add shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.quadraticCurveTo(cp.x, cp.y, to.x, to.y)
  ctx.stroke()

  drawArrowHead(ctx, to, ang, 26, "#f39c12")
  
  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.globalAlpha = 1
}

export function drawFLANK_RIGHT({ ctx, from, to, opacity = 1 }: DrawingContext) {
  const cp = getControlPoint(from, to, 120)
  const ang = angle(cp, to)

  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#f39c12"
  ctx.lineWidth = 6

  // Add shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.quadraticCurveTo(cp.x, cp.y, to.x, to.y)
  ctx.stroke()

  drawArrowHead(ctx, to, ang, 26, "#f39c12")
  
  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.globalAlpha = 1
}

export function drawENCIRCLE({ ctx, from, to, opacity = 1 }: DrawingContext) {
  const cp1 = getControlPoint(from, to, -100)
  const cp2 = getControlPoint(from, to, 100)
  const ang1 = angle(cp1, to)
  const ang2 = angle(cp2, to)

  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#8e44ad"
  ctx.lineWidth = 5

  // Add shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.quadraticCurveTo(cp1.x, cp1.y, to.x - 40, to.y - 40)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.quadraticCurveTo(cp2.x, cp2.y, to.x - 40, to.y + 40)
  ctx.stroke()

  drawArrowHead(ctx, { x: to.x - 40, y: to.y - 40 }, ang1, 24, "#8e44ad")
  drawArrowHead(ctx, { x: to.x - 40, y: to.y + 40 }, ang2, 24, "#8e44ad")
  
  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.globalAlpha = 1
}

export function drawFORTIFY({ ctx, from, opacity = 1 }: DrawingContext) {
  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#34495e"
  ctx.lineWidth = 3

  // Sawtooth fortification line in front of unit
  const toothWidth = 15
  const toothHeight = 15
  const teethCount = 6

  ctx.beginPath()
  ctx.moveTo(from.x - (teethCount * toothWidth) / 2, from.y - 30)

  for (let i = 0; i < teethCount; i++) {
    const x = from.x - (teethCount * toothWidth) / 2 + i * toothWidth
    ctx.lineTo(x + toothWidth / 2, from.y - 30 - toothHeight)
    ctx.lineTo(x + toothWidth, from.y - 30)
  }

  ctx.stroke()
  ctx.globalAlpha = 1
}

export function drawHOLD({ ctx, opacity = 1 }: DrawingContext) {
  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#3498db"
  ctx.lineWidth = 3

  // Diamond around unit position
  const size = 25
  // Diamond is already implicitly in the unit counter rendering
  ctx.globalAlpha = 1
}

export function drawAMBUSH({ ctx, from, opacity = 1 }: DrawingContext) {
  ctx.globalAlpha = opacity * 0.8
  ctx.fillStyle = "#16a085"
  ctx.font = "bold 20px serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("?", from.x, from.y)
  ctx.globalAlpha = 1
}

export function drawRETREAT({ ctx, from, to, opacity = 1 }: DrawingContext) {
  const ang = angle(from, to)

  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#95a5a6"
  ctx.lineWidth = 4
  ctx.setLineDash([6, 4])

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  ctx.setLineDash([])

  drawArrowHead(ctx, to, ang, 16, "#95a5a6")
  ctx.globalAlpha = 1
}

export function drawINFILTRATE({ ctx, from, to, opacity = 1 }: DrawingContext) {
  const ang = angle(from, to)
  const dist = distance(from, to)
  const step = dist / 4

  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#27ae60"
  ctx.lineWidth = 3
  ctx.setLineDash([3, 3])

  // Serpentine line
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)

  for (let i = 1; i <= 4; i++) {
    const x = from.x + Math.cos(ang) * i * step
    const y = from.y + Math.sin(ang) * i * step
    const sway = 15 * Math.sin((i / 4) * Math.PI * 2)
    ctx.lineTo(x + sway, y)
  }

  ctx.stroke()
  ctx.setLineDash([])

  drawArrowHead(ctx, to, ang, 16, "#27ae60")
  ctx.globalAlpha = 1
}

// Helper function to draw arrowhead
function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  to: { x: number; y: number },
  ang: number,
  len: number,
  color: string,
) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(to.x - len * Math.cos(ang - Math.PI / 6), to.y - len * Math.sin(ang - Math.PI / 6))
  ctx.lineTo(to.x - len * Math.cos(ang + Math.PI / 6), to.y - len * Math.sin(ang + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

// Helper function to draw starburst (for BOMBARD)
function drawStarburst(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath()
  const points = 12
  for (let i = 0; i < points * 2; i++) {
    const ang = (i / (points * 2)) * Math.PI * 2
    const rx = i % 2 === 0 ? size : size * 0.4
    const px = x + rx * Math.cos(ang)
    const py = y + rx * Math.sin(ang)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.fill()
}

export function drawBOMBARD({ ctx, to, opacity = 1 }: DrawingContext) {
  ctx.globalAlpha = opacity
  ctx.fillStyle = "rgba(231, 76, 60, 0.4)"
  ctx.strokeStyle = "#c0392b"
  ctx.lineWidth = 3
  
  drawStarburst(ctx, to.x, to.y, 45)
  
  // Scorch marks
  ctx.fillStyle = "rgba(44, 62, 80, 0.6)"
  ctx.beginPath()
  ctx.arc(to.x + 10, to.y + 10, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(to.x - 12, to.y - 5, 6, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 1
}

export function drawAIRSTRIKE({ ctx, from, to, opacity = 1 }: DrawingContext) {
  ctx.globalAlpha = opacity
  const ang = angle(from, to)
  
  // Plane/Flight Path silhouette
  ctx.strokeStyle = "rgba(44, 62, 80, 0.2)"
  ctx.lineWidth = 40
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  
  // Explosion at target
  ctx.fillStyle = "rgba(230, 126, 34, 0.6)"
  ctx.strokeStyle = "#d35400"
  ctx.lineWidth = 3
  drawStarburst(ctx, to.x, to.y, 60)
  
  // Plane icon at midpoint (simplified)
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  ctx.save()
  ctx.translate(midX, midY)
  ctx.rotate(ang)
  ctx.fillStyle = "#2c3e50"
  ctx.beginPath()
  ctx.moveTo(15, 0)
  ctx.lineTo(-10, 15)
  ctx.lineTo(-5, 5)
  ctx.lineTo(-20, 0)
  ctx.lineTo(-5, -5)
  ctx.lineTo(-10, -15)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  
  ctx.globalAlpha = 1
}

export function drawRECON({ ctx, to, opacity = 1 }: DrawingContext) {
  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#3498db"
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  
  // Concentric radar rings
  for(let r = 10; r <= 80; r += 20) {
     ctx.beginPath()
     ctx.arc(to.x, to.y, r, 0, Math.PI*2)
     ctx.stroke()
  }
  
  ctx.setLineDash([])
  // Crosshair
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(to.x - 90, to.y)
  ctx.lineTo(to.x + 90, to.y)
  ctx.moveTo(to.x, to.y - 90)
  ctx.lineTo(to.x, to.y + 90)
  ctx.stroke()

  ctx.globalAlpha = 1
}

export function drawSUPPRESS({ ctx, from, to, opacity = 1 }: DrawingContext) {
  const ang = angle(from, to)
  const dist = distance(from, to)

  ctx.globalAlpha = opacity
  ctx.fillStyle = "rgba(231, 76, 60, 0.6)"
  
  // Cone of fire
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x + 40 * Math.cos(ang + 0.3), to.y + 40 * Math.sin(ang + 0.3))
  ctx.lineTo(to.x + 40 * Math.cos(ang - 0.3), to.y + 40 * Math.sin(ang - 0.3))
  ctx.closePath()
  
  const grad = ctx.createRadialGradient(from.x, from.y, 10, to.x, to.y, 60)
  grad.addColorStop(0, "rgba(231, 76, 60, 0)")
  grad.addColorStop(1, "rgba(231, 76, 60, 0.4)")
  ctx.fillStyle = grad
  ctx.fill()

  // Impact dots
  ctx.fillStyle = "#e74c3c"
  for (let i = 0; i < 8; i++) {
    const r = Math.random() * 30
    const a = Math.random() * Math.PI * 2
    ctx.beginPath()
    ctx.arc(to.x + r * Math.cos(a), to.y + r * Math.sin(a), 3, 0, Math.PI * 2)
    ctx.fill()
  }
  
  ctx.globalAlpha = 1
}

export function drawUnitStatus(
  ctx: CanvasRenderingContext2D,
  location: { x: number; y: number },
  status: "fresh" | "engaged" | "wavering" | "routing",
  size = 30,
) {
  const radius = size / 2 + 8

  switch (status) {
    case "fresh":
      ctx.strokeStyle = "#27ae60"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(location.x, location.y, radius, 0, Math.PI * 2)
      ctx.stroke()
      break

    case "engaged":
      ctx.strokeStyle = "#e67e22"
      ctx.lineWidth = 2.5
      // Pulsing effect simulated with dashes
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.arc(location.x, location.y, radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      break

    case "wavering":
      ctx.strokeStyle = "#e74c3c"
      ctx.lineWidth = 2
      ctx.setLineDash([4, 2])
      ctx.beginPath()
      ctx.arc(location.x, location.y, radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      break

    case "routing":
      ctx.globalAlpha = 0.5
      ctx.fillStyle = "#95a5a6"
      ctx.beginPath()
      ctx.arc(location.x, location.y, size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      // Motion blur effect
      ctx.strokeStyle = "rgba(149, 165, 166, 0.3)"
      ctx.lineWidth = 2
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath()
        ctx.arc(location.x + i * 8, location.y, size / 2 - i * 2, 0, Math.PI * 2)
        ctx.stroke()
      }
      break
  }
}

export function drawThreatZone(ctx: CanvasRenderingContext2D, location: { x: number; y: number }, range = 80) {
  ctx.strokeStyle = "rgba(231, 76, 60, 0.2)"
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.arc(location.x, location.y, range, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
}

export function drawFrontline(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const dist = distance(from, to)
  const ang = angle(from, to)

  ctx.strokeStyle = "#c0392b"
  ctx.lineWidth = 3
  ctx.setLineDash([6, 4])

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  ctx.setLineDash([])
}

export function drawFogOfIntent(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  isReal = false,
) {
  const ang = angle(from, to)

  ctx.globalAlpha = isReal ? 0.7 : 0.3
  ctx.strokeStyle = isReal ? "#3498db" : "#95a5a6"
  ctx.lineWidth = 3
  ctx.setLineDash([8, 4])

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  drawArrowHead(ctx, to, ang, 16, isReal ? "#3498db" : "#95a5a6")
  ctx.globalAlpha = 1
  ctx.setLineDash([])
}

// --- NEW VISUAL RENDERERS ---

export function drawHACK({ ctx, from, to, opacity = 1 }: DrawingContext) {
  const dist = distance(from, to)
  const ang = angle(from, to)

  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#00ff41" // Matrix Green
  ctx.lineWidth = 2
  ctx.shadowColor = "#00ff41"
  ctx.shadowBlur = 10

  // Draw jagged digital line
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  
  const segments = 10
  const stepX = (to.x - from.x) / segments
  const stepY = (to.y - from.y) / segments

  for (let i = 1; i < segments; i++) {
    const jitter = (Math.random() - 0.5) * 15
    // Orthogonal steps for "digital" feel
    if (i % 2 === 0) {
       ctx.lineTo(from.x + stepX * i, from.y + stepY * i + jitter)
    } else {
       ctx.lineTo(from.x + stepX * i + jitter, from.y + stepY * i)
    }
  }
  
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  // Binary bits flowing
  const time = Date.now() / 100
  const bits = "101101"
  ctx.fillStyle = "#00ff41"
  ctx.font = "10px monospace"
  ctx.textAlign = "center"
  
  // Draw binary at 3 points along line
  for(let t=0.2; t<0.9; t+=0.3) {
     const bx = from.x + (to.x - from.x) * t
     const by = from.y + (to.y - from.y) * t
     ctx.fillText(bits[Math.floor(Math.random()*6)], bx, by - 5)
  }

  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

export function drawFIRE_SHIP({ ctx, from, to, opacity = 1 }: DrawingContext) {
  const ang = angle(from, to)
  
  ctx.globalAlpha = opacity
  
  // Main path - orange/red gradient
  const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
  grad.addColorStop(0, "rgba(255, 140, 0, 0)")
  grad.addColorStop(0.5, "rgba(255, 69, 0, 0.6)")
  grad.addColorStop(1, "rgba(255, 0, 0, 0.8)")
  
  ctx.strokeStyle = grad
  ctx.lineWidth = 12 // Wide path representing fire spread
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  
  // Flame particles at target
  ctx.fillStyle = "#ff4500"
  for(let i=0; i<5; i++) {
     const r = 10 + Math.random() * 10
     const a = Math.random() * Math.PI * 2
     ctx.beginPath()
     ctx.arc(to.x + Math.cos(a)*10, to.y + Math.sin(a)*10, r, 0, Math.PI*2)
     ctx.fill()
  }

  ctx.globalAlpha = 1
}

export function drawNAVAL_RAM({ ctx, from, to, opacity = 1 }: DrawingContext) {
  // Heavy solid arrow
  ctx.globalAlpha = opacity
  ctx.strokeStyle = "#2c3e50"
  ctx.lineWidth = 10
  ctx.lineCap = "butt"
  
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  
  // Impact ripples
  ctx.strokeStyle = "#3498db"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(to.x, to.y, 15, 0, Math.PI*2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(to.x, to.y, 25, 0, Math.PI*2)
  ctx.stroke()
  
  ctx.globalAlpha = 1
}

export function drawTRAMPLE({ ctx, from, to, opacity = 1 }: DrawingContext) {
  const ang = angle(from, to)
  
  ctx.globalAlpha = opacity
  // Very thick, blunt arrow representing sheer mass
  ctx.strokeStyle = "#5e4b35" // Dark leather/mud color
  ctx.fillStyle = "#5e4b35"
  ctx.lineWidth = 18 
  
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  
  // Blunt Head
  ctx.beginPath()
  ctx.arc(to.x, to.y, 12, 0, Math.PI*2)
  ctx.fill()
  
  // "Shockwaves" on sides
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(to.x - 20, to.y - 20); ctx.lineTo(to.x + 10, to.y - 30);
  ctx.moveTo(to.x - 20, to.y + 20); ctx.lineTo(to.x + 10, to.y + 30);
  ctx.stroke()

  ctx.globalAlpha = 1
}

export function drawRAIN_ARROWS({ ctx, from, to, opacity = 1 }: DrawingContext) {
  ctx.globalAlpha = opacity
  ctx.strokeStyle = "rgba(44, 62, 80, 0.6)"
  ctx.lineWidth = 1.5
  
  const dist = distance(from, to)
  const ang = angle(from, to)
  
  // Draw 5 distinct high arcs
  for(let i=-2; i<=2; i++) {
     const offset = i * 15;
     const cp = getControlPoint(from, to, -dist/3 + Math.abs(i)*5); // High arc
     
     ctx.beginPath()
     ctx.moveTo(from.x, from.y)
     ctx.quadraticCurveTo(cp.x + offset, cp.y, to.x + offset/2, to.y + offset/2)
     ctx.stroke()
     
     // Small arrowheads at landing
     const landX = to.x + offset/2
     const landY = to.y + offset/2
     ctx.beginPath()
     ctx.arc(landX, landY, 2, 0, Math.PI*2)
     ctx.fill()
  }
  
  ctx.globalAlpha = 1
}

export function drawCOMBINED_ASSAULT({ ctx, from, to, opacity = 1 }: DrawingContext) {
  // Composite action showing coordinated artillery + infantry + cavalry
  // Draw in three phases with different colors
  
  const ang = angle(from, to)
  
  ctx.globalAlpha = opacity * 0.6
  
  // Phase 1: Artillery bombardment (Red explosion at target)
  ctx.fillStyle = "rgba(231, 76, 60, 0.3)"
  ctx.strokeStyle = "#c0392b"
  ctx.lineWidth = 2
  drawStarburst(ctx, to.x, to.y, 40)
  
  // Phase 2: Infantry advance (Thick arrows)
  ctx.globalAlpha = opacity * 0.8
  ctx.strokeStyle = "#2c3e50"
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(from.x - 10, from.y - 10)
  ctx.lineTo(to.x - 10, to.y - 10)
  ctx.stroke()
  drawArrowHead(ctx, { x: to.x - 10, y: to.y - 10 }, ang, 20, "#2c3e50")
  
  // Phase 3: Cavalry flanking (Curved arrow)
  ctx.globalAlpha = opacity * 0.7
  ctx.strokeStyle = "#f39c12"
  ctx.lineWidth = 4
  const cp = getControlPoint(from, to, 80)
  ctx.beginPath()
  ctx.moveTo(from.x + 10, from.y + 10)
  ctx.quadraticCurveTo(cp.x, cp.y, to.x + 10, to.y + 10)
  ctx.stroke()
  drawArrowHead(ctx, { x: to.x + 10, y: to.y + 10 }, angle(cp, to), 20, "#f39c12")
  
  ctx.globalAlpha = 1
}

export function renderVisualAction(action: VisualActionType, context: DrawingContext): boolean {
  const renderers: Record<VisualActionType, (ctx: DrawingContext) => void> = {
    ADVANCE: drawADVANCE,
    ASSAULT: drawASSAULT,
    FLANK_LEFT: drawFLANK_LEFT,
    FLANK_RIGHT: drawFLANK_RIGHT,
    RETREAT: drawRETREAT,
    INFILTRATE: drawINFILTRATE,
    ENCIRCLE: drawENCIRCLE,
    SPEARHEAD: drawADVANCE, // Heavy version of advance
    FORTIFY: drawFORTIFY,
    BLOCKADE: drawAMBUSH, // Visual similarity
    HOLD: drawHOLD,
    AMBUSH: drawAMBUSH,
    BOMBARD: drawBOMBARD,
    SUPPRESS: drawSUPPRESS,
    SEVER_SUPPLY: drawAMBUSH, // Scissors icon
    FEINT: drawRETREAT, // Phantom arrow
    AIRSTRIKE: drawAIRSTRIKE,
    RECON: drawRECON,
    COMBINED_ASSAULT: drawCOMBINED_ASSAULT, // Composite action
    REGION_BOMBARDMENT: drawBOMBARD, // Region-wide bombardment
    REGION_ENCIRCLEMENT: drawENCIRCLE, // Region encirclement
    HACK: drawHACK,
    EMP_BLAST: drawBOMBARD, // Reuse bombard visual but maybe change color in future
    NAVAL_RAM: drawNAVAL_RAM,
    FIRE_SHIP: drawFIRE_SHIP,
    GATES_OPEN: drawINFILTRATE,
    TRAMPLE: drawTRAMPLE,
    RAIN_ARROWS: drawRAIN_ARROWS,
  }

  const renderer = renderers[action]
  if (renderer) {
    renderer(context)
    return true
  }

  console.warn(`[renderVisualAction] No renderer for action: ${action}`)
  return false
}
