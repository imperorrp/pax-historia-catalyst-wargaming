"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useTargetingStore } from "@/lib/targeting-store"
import type { Unit } from "@/lib/types"
import { resolveSemanticPosition } from "@/lib/geometry-utils"

interface UnitCounterProps {
  unit: Unit
}

export function UnitCounter({ unit }: UnitCounterProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { state, selectedTactic, selectedUnit, currentScenario } = useTargetingStore()
  const regions = currentScenario.mapRegions
  const mesh = currentScenario.tacticalMesh

  const isPlayer = unit.owner === "player"

  const isValidTarget =
    state === "tactic_selected" &&
    unit.owner === "player" &&
    (!selectedTactic?.requiredUnitTypes || selectedTactic.requiredUnitTypes.includes(unit.type))

  const isSelected = state === "unit_selected" && selectedUnit?.id === unit.id
  const opacity = state === "idle" || isValidTarget || isSelected ? 1 : 0.3

  const drawNATOSymbol = () => {
    const symbolMap = {
      infantry: "⊠",
      armor: "◯",
      cavalry: "∇",
      artillery: "⚡",
    }
    return symbolMap[unit.type]
  }

  const handleClick = () => {
    if (state === "tactic_selected" && isValidTarget) {
      useTargetingStore.setState({ selectedUnit: unit, state: "unit_selected" })
    }
  }

  // Unit Placement Logic: Hex > Mesh > Location > Semantic
  let loc = { x: 0, y: 0 }
  
  if (unit.q !== undefined && unit.r !== undefined && currentScenario.hexGrid) {
    // Hex Lookup
    const hex = currentScenario.hexGrid.find(h => h.q === unit.q && h.r === unit.r)
    if (hex) {
       loc = { x: hex.x, y: hex.y }
    } else {
       // Fallback if hex not found (e.g. out of bounds)
       // Calculate manually? (Assume pointy top radius 30)
       const hexRadius = 30;
       loc = {
         x: (hexRadius * Math.sqrt(3) * (unit.q + unit.r / 2)),
         y: (hexRadius * 3 / 2 * unit.r)
       }
    }
  } else if (unit.nodeId && mesh) {
    const node = mesh.nodes.find(n => n.id === unit.nodeId)
    if (node) loc = { x: node.x, y: node.y }
  } else if (unit.location) {
    loc = unit.location
  } else if (unit.semanticPos) {
    loc = resolveSemanticPosition(unit.semanticPos, regions)
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity, left: loc.x, top: loc.y }}
      transition={{ duration: 0.4, type: "spring" }}
      className="absolute"
      style={{
        transform: "translate(-50%, -50%)",
        pointerEvents: state === "tactic_selected" && !isValidTarget ? "none" : "auto",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* NATO Counter Block */}
      <motion.div
        animate={{
          scale: isSelected ? 1.2 : isValidTarget && isHovered ? 1.1 : 1,
          filter: isSelected ? "drop-shadow(0 0 8px rgba(255, 193, 7, 0.6))" : "drop-shadow(1px 2px 2px rgba(0,0,0,0.3))",
        }}
        transition={{ duration: 0.2 }}
        onClick={handleClick}
        className={`
          w-14 h-11 flex flex-col items-center justify-center cursor-pointer select-none relative
          border-2 transition-all font-serif font-bold tracking-tight
          ${isPlayer ? "bg-blue-100 border-blue-900 text-blue-950" : "bg-red-100 border-red-900 text-red-950"}
          ${isValidTarget && !isSelected ? "ring-2 ring-amber-400" : ""}
          ${isSelected ? "ring-2 ring-yellow-500 ring-offset-1" : ""}
        `}
        style={{
           backgroundImage: "linear-gradient(rgba(255,255,255,0), rgba(0,0,0,0.05))"
        }}
      >
        {/* Faction Flag */}
        <div className={`absolute -top-2 -left-2 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
          isPlayer ? 'bg-blue-600' : 'bg-red-600'
        }`} />
        
        <span className="text-xl leading-none -mt-1">{drawNATOSymbol()}</span>
        <span className="text-[10px] uppercase mt-0 w-full text-center truncate px-0.5 leading-tight">
          {unit.name.replace("Division", "Div").replace("Regiment", "Reg")}
        </span>
        
        {/* Status Pip */}
        {unit.status !== "fresh" && (
           <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${
              unit.status === 'engaged' ? 'bg-orange-500' : 'bg-gray-500'
           }`} />
        )}
      </motion.div>

      {/* Tooltip */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-0 top-16 z-50 whitespace-nowrap pointer-events-none"
        >
          <div className="bg-amber-900 text-amber-50 px-3 py-2 rounded-md shadow-xl text-xs font-serif">
            <div className="font-bold">{unit.name}</div>
            <div className="text-xs opacity-90">{unit.tags.join(" • ")}</div>
            {state === "tactic_selected" && !isValidTarget && (
              <div className="text-xs text-amber-200 mt-1">Not valid for this tactic</div>
            )}
          </div>
          <div className="absolute left-2 -top-1 w-2 h-2 bg-amber-900 rotate-45" />
        </motion.div>
      )}
    </motion.div>
  )
}
