"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useTargetingStore } from "@/lib/targeting-store"
import type { Unit } from "@/lib/types"
import { hexToPixel } from "@/lib/grid-engine/hex-math"
// import { resolveSemanticPosition } from "@/lib/geometry-utils" // Deprecated for Hex

interface UnitCounterProps {
  unit: Unit
}

export function UnitCounter({ unit }: UnitCounterProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { state, selectedTactic, selectedUnit, currentScenario } = useTargetingStore()

  const isPlayer = unit.owner === "player"

  // Calculate display position from hex coordinates
  // IMPORTANT: Look up the hex in the scenario's hexGrid to get the actual pixel position
  let displayPos = { x: 50, y: 50 }; // Fallback

  if (unit.hex && currentScenario.hexGrid) {
    const key = `${unit.hex.q},${unit.hex.r}`;
    const hexData = currentScenario.hexIndex?.[key] ?? currentScenario.hexGrid.find(h => h.q === unit.hex!.q && h.r === unit.hex!.r);
    if (hexData) {
      displayPos = { x: hexData.x, y: hexData.y };
    } else {
      console.warn(`Unit ${unit.id} hex (${unit.hex.q}, ${unit.hex.r}) not found in hexGrid`);
    }
  } else if (!unit.hex) {
    console.warn(`Unit ${unit.id} missing hex coordinates`);
  }

  const finalX = displayPos.x;
  const finalY = displayPos.y;

  const isValidTarget =
    state === "tactic_selected" &&
    unit.owner === "player" &&
    (!selectedTactic?.requiredUnitTypes || selectedTactic.requiredUnitTypes.includes(unit.type))

  const isSelected = selectedUnit?.id === unit.id

  // Check for stacked units in same hex
  const stackedUnits = currentScenario.units.filter(u => 
    u.hex && unit.hex && u.hex.q === unit.hex.q && u.hex.r === unit.hex.r
  )
  const isStacked = stackedUnits.length > 1
  const stackIndex = stackedUnits.findIndex(u => u.id === unit.id)
  const stackCount = stackedUnits.length

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
    } else if (state === "idle" || state === "unit_selected") {
      // Toggle unit selection - if same unit clicked, deselect it
      if (selectedUnit?.id === unit.id) {
        useTargetingStore.getState().selectUnit(null)
      } else {
        useTargetingStore.getState().selectUnit(unit)
      }
    }
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, left: finalX, top: finalY }}
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
        
        {/* Stack Indicator */}
        {stackCount > 1 && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 border border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
            {stackCount}
          </div>
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
