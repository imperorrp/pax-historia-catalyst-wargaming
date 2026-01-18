"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTargetingStore } from "@/lib/targeting-store"
import type { Unit } from "@/lib/types"

interface UnitCounterProps {
  unit: Unit
}

export function UnitCounter({ unit }: UnitCounterProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { state, selectedTactic, selectedUnit, currentScenario } = useTargetingStore()
  
  const isPlayer = unit.owner === "player"
  
  // Calculate display position (only used after client mount to avoid SSR mismatch)
  let displayPos = { x: 50, y: 50 };
  let isNearBottom = false;

  if (mounted && unit.hex && currentScenario.hexGrid) {
    const key = `${unit.hex.q},${unit.hex.r}`;
    const hexData = currentScenario.hexIndex?.[key] ?? currentScenario.hexGrid.find(h => h.q === unit.hex!.q && h.r === unit.hex!.r);
    if (hexData) {
      displayPos = { x: hexData.x, y: hexData.y };
      // Safe zone check: if unit is in bottom 20% of map, flip tooltip up
      isNearBottom = hexData.y > (currentScenario.mapDimensions.height * 0.75);
    }
  }

  const isValidTarget =
    state === "tactic_selected" &&
    unit.owner === "player" &&
    (!selectedTactic?.requiredUnitTypes || selectedTactic.requiredUnitTypes.includes(unit.type))

  const isSelected = selectedUnit?.id === unit.id

  // Check for stacked units in same hex
  const stackedUnits = currentScenario.units.filter(u => 
    u.hex && unit.hex && u.hex.q === unit.hex.q && u.hex.r === unit.hex.r
  )
  const stackCount = stackedUnits.length

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (state === "tactic_selected" && isValidTarget) {
      useTargetingStore.setState({ selectedUnit: unit, state: "unit_selected" })
    } else if (state === "idle" || state === "unit_selected") {
      // Toggle unit selection
      if (selectedUnit?.id === unit.id) {
        useTargetingStore.getState().selectUnit(null)
      } else {
        useTargetingStore.getState().selectUnit(unit)
      }
    }
  }

  // Render SVG icons for NATO symbols
  const renderIcon = () => {
    const stroke = isPlayer ? "#1e3a8a" : "#7f1d1d"; // blue-950 : red-950
    
    switch (unit.type) {
      case 'infantry':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-0.5 opacity-80">
            <line x1="0" y1="0" x2="100" y2="100" stroke={stroke} strokeWidth="8" />
            <line x1="100" y1="0" x2="0" y2="100" stroke={stroke} strokeWidth="8" />
          </svg>
        );
      case 'armor': 
      case 'chariot': // Chariots share Armor symbol (mobility + shock)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1 opacity-80">
            <ellipse cx="50" cy="50" rx="40" ry="25" fill="none" stroke={stroke} strokeWidth="6" />
          </svg>
        );
      case 'elephant': // A heavy rectangle with a "trunk" line
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1 opacity-80">
             <rect x="20" y="30" width="60" height="40" fill="none" stroke={stroke} strokeWidth="6" />
             <line x1="80" y1="50" x2="95" y2="30" stroke={stroke} strokeWidth="6" />
          </svg>
        );
      case 'cavalry': // Single diagonal or special
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-0.5 opacity-80">
            <line x1="0" y1="100" x2="100" y2="0" stroke={stroke} strokeWidth="6" />
          </svg>
        );
      case 'artillery': // Dot
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-0.5 opacity-80">
            <circle cx="50" cy="50" r="10" fill={stroke} />
          </svg>
        );
      case 'naval': // Wave-like symbol
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-0.5 opacity-80">
            <path d="M10 50 Q25 30 40 50 Q55 70 70 50 Q85 30 100 50" fill="none" stroke={stroke} strokeWidth="6" />
          </svg>
        );
      default:
        return <span className="text-lg font-bold">?</span>;
    }
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, x: "-50%", y: "-50%" }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        x: "-50%",
        y: "-50%",
        zIndex: isHovered ? 50 : isSelected ? 40 : 30
      }}
      style={{
        ...(mounted ? { left: displayPos.x, top: displayPos.y } : {}),
        pointerEvents: state === "tactic_selected" && !isValidTarget ? "none" : "auto",
        zIndex: isHovered ? 50 : isSelected ? 40 : 30
      }}
      transition={{ duration: 0.4, type: "spring" }}
      className="absolute"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Unit Card / Counter */}
      <motion.div
        animate={{
          scale: isSelected ? 1.15 : isValidTarget && isHovered ? 1.05 : 1,
          y: isSelected ? -4 : 0,
        }}
        className={`
          relative w-12 h-8 flex flex-col items-center justify-between
          border-2 transition-all shadow-md backdrop-blur-sm select-none
          rounded-[2px] overflow-hidden
          ${isPlayer ? "bg-blue-100/95 border-blue-800 text-blue-900" : "bg-red-100/95 border-red-800 text-red-900"}
          ${isValidTarget && !isSelected ? "ring-2 ring-amber-400 ring-offset-1" : ""}
          ${isSelected ? "ring-2 ring-yellow-500 ring-offset-2 border-yellow-700" : ""}
        `}
      >
        {/* Unit Size Marker (Top) */}
        <div className="w-full text-[7px] leading-[7px] pt-[1px] text-center font-mono opacity-60 font-bold">
           XX
        </div>

        {/* Symbol (Center) */}
        <div className="absolute inset-0 flex items-center justify-center p-0.5 pointer-events-none">
          {renderIcon()}
        </div>

        {/* Name (Bottom Label) */}
        <div className="w-full bg-white/40 text-[8px] font-bold text-center leading-tight py-0.5 truncate px-0.5 mt-auto backdrop-blur-[1px]">
          {unit.name.replace(/(Division|Regiment|Brigade)/g, '').trim()}
        </div>

        {/* Stack Counter (if any) */}
        {stackCount > 1 && (
           <div className="absolute -top-1.5 -right-1.5 bg-amber-600/90 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-white shadow-sm font-bold z-10">
              +{stackCount-1}
           </div>
        )}

        {/* Status indicator */}
        {unit.status !== 'fresh' && (
           <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              unit.status === 'engaged' ? 'bg-orange-500' : 'bg-red-500'
           }`} />
        )}
      </motion.div>

      {/* Conditional Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: isNearBottom ? 5 : -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute left-1/2 -translate-x-1/2 z-[60] min-w-[180px] pointer-events-none 
              ${isNearBottom ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'}
            `}
          >
             <div className="bg-slate-800 text-slate-100 rounded-lg shadow-xl border border-slate-600 p-0 text-xs overflow-hidden">
                <div className={`px-3 py-2 font-bold text-sm border-b border-white/10 ${isPlayer ? 'bg-blue-900/40 text-blue-100' : 'bg-red-900/40 text-red-100'}`}>
                   {unit.name}
                </div>
                <div className="p-3 space-y-1.5">
                   <div className="flex justify-between">
                      <span className="text-slate-400">Type</span>
                      <span className="capitalize font-medium">{unit.type}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className={`uppercase font-bold text-[10px] px-1.5 py-0.5 rounded ${
                         unit.status === 'fresh' ? 'bg-green-500/20 text-green-400' : 
                         unit.status === 'engaged' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                         {unit.status}
                      </span>
                   </div>
                   <div className="pt-1 border-t border-white/5">
                      <span className="text-slate-500 italic block text-[10px]">{unit.tags.join(" • ")}</span>
                   </div>
                </div>
             </div>
             {/* Arrow */}
             <div className={`
                absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 border-r border-b border-slate-600 transform rotate-45
                ${isNearBottom ? '-bottom-2 border-t-0 border-l-0 border-r border-b' : '-top-2 border-b-0 border-r-0 border-t border-l'}
             `} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

