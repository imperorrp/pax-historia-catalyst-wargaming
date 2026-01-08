"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useTargetingStore } from "@/lib/targeting-store"
import type { Unit } from "@/lib/types"

interface UnitCounterProps {
  unit: Unit
}

export function UnitCounter({ unit }: UnitCounterProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { state, selectedTactic, selectedUnit } = useTargetingStore()
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

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity }}
      transition={{ duration: 0.4, type: "spring" }}
      className="absolute"
      style={{
        left: `${(unit.location.x / 800) * 100}%`,
        top: `${(unit.location.y / 500) * 100}%`,
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
          filter: isSelected ? "drop-shadow(0 0 12px rgba(255, 193, 7, 0.9))" : "drop-shadow(0 0 3px rgba(0,0,0,0.2))",
        }}
        transition={{ duration: 0.2 }}
        onClick={handleClick}
        className={`
          w-20 h-12 rounded-sm flex flex-col items-center justify-center cursor-pointer
          border-2 shadow-md transition-all font-serif font-bold text-sm
          ${isPlayer ? "bg-blue-50 border-blue-700 text-blue-900" : "bg-red-50 border-red-700 text-red-900"}
          ${isValidTarget && !isSelected ? "ring-2 ring-amber-400 hover:ring-amber-300" : ""}
          ${isSelected ? "ring-2 ring-yellow-400 ring-offset-2" : ""}
        `}
      >
        <span className="text-lg leading-none">{drawNATOSymbol()}</span>
        <span className="text-xs mt-0.5 opacity-80">{unit.name.split(" ")[0]}</span>
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
