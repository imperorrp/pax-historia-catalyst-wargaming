"use client"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useTargetingStore } from "@/lib/targeting-store"
import type { WarRoomScenario } from "@/lib/types"
import { renderVisualAction, drawUnitStatus, drawThreatZone } from "@/lib/visual-action-library"
import { Grid3X3 } from "lucide-react"

interface WarRoomMapProps {
  scenario: WarRoomScenario
}

export function WarRoomMap({ scenario }: WarRoomMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRendered, setIsRendered] = useState(false)
  const { selectedTactic, visibleLayers } = useTargetingStore()
  const [showLayerPanel, setShowLayerPanel] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = scenario.mapDimensions.width
    canvas.height = scenario.mapDimensions.height

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#F3E5AB"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const imageData = ctx.createImageData(canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 8
      data[i] += noise
      data[i + 1] += noise * 0.8
      data[i + 2] += noise * 0.6
      data[i + 3] = 255
    }
    ctx.putImageData(imageData, 0, 0)

    if (visibleLayers.grid) {
      ctx.strokeStyle = "rgba(44, 62, 80, 0.05)"
      ctx.lineWidth = 1
      const gridSize = 50
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    if (visibleLayers.regions) {
      scenario.mapRegions.forEach((region) => {
        const isEnemyRegion = Math.random() > 0.6

        ctx.beginPath()
        ctx.moveTo(region.points[0][0], region.points[0][1])
        for (let i = 1; i < region.points.length; i++) {
          ctx.lineTo(region.points[i][0], region.points[i][1])
        }
        ctx.closePath()

        ctx.fillStyle = isEnemyRegion ? "rgba(192, 57, 43, 0.08)" : "#FFF9E6"
        ctx.fill()

        ctx.strokeStyle = "#2c3e50"
        ctx.lineWidth = 2.5
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.stroke()

        if (isEnemyRegion) {
          drawHachure(ctx, region.points, 8)
        }

        if (visibleLayers.terrain) {
          drawTerrainFeatures(ctx, region)
        }

        const centerX = region.points.reduce((sum, p) => sum + p[0], 0) / region.points.length
        const centerY = region.points.reduce((sum, p) => sum + p[1], 0) / region.points.length

        ctx.fillStyle = "#2c3e50"
        ctx.font = "bold 13px serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(region.name, centerX, centerY)
      })
    }

    if (visibleLayers.units) {
      scenario.units.forEach((unit) => {
        drawUnitCounter(ctx, unit.location, unit.owner, unit.type, 1)
        if (unit.status) {
          drawUnitStatus(ctx, unit.location, unit.status, 30)
        }
        if (unit.type === "artillery") {
          drawThreatZone(ctx, unit.location, 80)
        }
      })
    }

    if (selectedTactic) {
      const playerUnits = scenario.units.filter((u) => u.owner === "player")
      const enemyUnits = scenario.units.filter((u) => u.owner === "enemy")

      if (playerUnits.length > 0 && enemyUnits.length > 0) {
        playerUnits.forEach((playerUnit) => {
          enemyUnits.forEach((enemyUnit) => {
            renderVisualAction(selectedTactic.semanticAction as any, {
              ctx,
              from: playerUnit.location,
              to: enemyUnit.location,
              opacity: 0.7,
            })
          })
        })
      }
    }

    setIsRendered(true)
  }, [scenario, selectedTactic, visibleLayers])

  function drawUnitCounter(
    ctx: CanvasRenderingContext2D,
    location: { x: number; y: number },
    owner: string,
    type: string,
    opacity: number,
  ) {
    const size = 30
    ctx.globalAlpha = opacity

    ctx.fillStyle = owner === "player" ? "rgba(52, 152, 219, 0.7)" : "rgba(192, 57, 43, 0.7)"
    ctx.fillRect(location.x - size / 2, location.y - size / 2, size, size)

    ctx.strokeStyle = owner === "player" ? "#3498db" : "#c0392b"
    ctx.lineWidth = 2
    ctx.strokeRect(location.x - size / 2, location.y - size / 2, size, size)

    ctx.fillStyle = "white"
    ctx.font = "bold 14px serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    const icons: Record<string, string> = {
      armor: "⊞",
      infantry: "⊠",
      cavalry: "◯",
      artillery: "◆",
    }
    ctx.fillText(icons[type] || "⊠", location.x, location.y)
    ctx.globalAlpha = 1
  }

  function drawHachure(ctx: CanvasRenderingContext2D, points: [number, number][], spacing: number) {
    const xs = points.map((p) => p[0])
    const ys = points.map((p) => p[1])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    ctx.strokeStyle = "rgba(192, 57, 43, 0.15)"
    ctx.lineWidth = 1
    ctx.setLineDash([3, 2])

    for (let x = minX; x < maxX; x += spacing) {
      ctx.beginPath()
      ctx.moveTo(x, minY)
      ctx.lineTo(x + (maxY - minY), maxY)
      ctx.stroke()
    }
    ctx.setLineDash([])
  }

  function drawTerrainFeatures(ctx: CanvasRenderingContext2D, region: any) {
    const centerX = region.points.reduce((sum: number, p: [number, number]) => sum + p[0], 0) / region.points.length
    const centerY = region.points.reduce((sum: number, p: [number, number]) => sum + p[1], 0) / region.points.length

    ctx.strokeStyle = "rgba(52, 152, 219, 0.25)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(centerX - 15, centerY - 15, 6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(centerX + 15, centerY - 15, 6, 0, Math.PI * 2)
    ctx.stroke()
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: isRendered ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-full"
    >
      <button
        onClick={() => setShowLayerPanel(!showLayerPanel)}
        className="absolute top-4 left-4 z-20 p-2.5 bg-amber-900/10 hover:bg-amber-900/20 rounded-lg transition-colors text-amber-800 backdrop-blur-sm border border-amber-900/15"
      >
        <Grid3X3 className="w-5 h-5" />
      </button>

      {showLayerPanel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-14 left-4 z-20 bg-amber-50/95 backdrop-blur-sm rounded-lg border border-amber-900/15 shadow-lg p-3 min-w-40"
        >
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer hover:text-amber-700 transition-colors">
              <input
                type="checkbox"
                checked={visibleLayers.grid}
                onChange={() => useTargetingStore.getState().toggleLayer("grid")}
                className="w-4 h-4"
              />
              <span className="font-serif">Grid</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-amber-700 transition-colors">
              <input
                type="checkbox"
                checked={visibleLayers.units}
                onChange={() => useTargetingStore.getState().toggleLayer("units")}
                className="w-4 h-4"
              />
              <span className="font-serif">Units</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-amber-700 transition-colors">
              <input
                type="checkbox"
                checked={visibleLayers.terrain}
                onChange={() => useTargetingStore.getState().toggleLayer("terrain")}
                className="w-4 h-4"
              />
              <span className="font-serif">Terrain</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-amber-700 transition-colors">
              <input
                type="checkbox"
                checked={visibleLayers.regions}
                onChange={() => useTargetingStore.getState().toggleLayer("regions")}
                className="w-4 h-4"
              />
              <span className="font-serif">Regions</span>
            </label>
          </div>
        </motion.div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        style={{
          imageRendering: "auto",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
        }}
      />
    </motion.div>
  )
}
