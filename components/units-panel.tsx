"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { Radio, ChevronUp, ChevronDown } from "lucide-react"
import { useTargetingStore } from "@/lib/targeting-store"

interface UnitsPanelProps {
  isExpanded: boolean
  onToggle: () => void
  currentScenario: any
  selectedUnit: any
}

export function UnitsPanel({
  isExpanded,
  onToggle,
  currentScenario,
  selectedUnit
}: UnitsPanelProps) {
  const unitsSidebarRef = useRef<HTMLDivElement>(null)

  return (
    <div className="hidden lg:flex flex-col col-span-2 bg-amber-900/5 rounded-lg border border-amber-900/10 overflow-hidden backdrop-blur-sm h-full">
      <button
        onClick={onToggle}
        className="flex items-center justify-between gap-2 p-2 md:p-3 border-b border-amber-900/10 hover:bg-amber-900/5 transition-colors flex-shrink-0"
      >
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 flex-shrink-0 text-amber-700" />
          <h2 className="font-serif font-bold text-xs md:text-sm text-amber-900">UNITS</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-amber-700" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-700" />
        )}
      </button>

      {isExpanded && (
        <div ref={unitsSidebarRef} className="flex-1 overflow-y-auto space-y-1.5 p-2">
          {currentScenario.units.map((unit) => {
            const isSelected = selectedUnit?.id === unit.id
            return (
              <motion.div
                key={unit.id}
                data-unit-id={unit.id}
                onClick={() => useTargetingStore.getState().selectUnit(unit)}
                className={`
                  p-1.5 md:p-2 rounded-lg text-[10px] md:text-xs border-l-4 transition-all font-serif relative cursor-pointer
                  hover:shadow-sm hover:scale-[1.01] transform-gpu
                  ${isSelected
                    ? 'ring-1 ring-amber-400 ring-offset-1 shadow-sm bg-gradient-to-r'
                    : 'hover:bg-amber-50/30'
                  }
                  ${
                    unit.owner === "player"
                      ? `border-blue-500 ${isSelected ? 'from-blue-100 to-blue-50' : 'bg-blue-50/50'} text-blue-900`
                      : `border-red-500 ${isSelected ? 'from-red-100 to-red-50' : 'bg-red-50/50'} text-red-900`
                  }
                `}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center"
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </motion.div>
                )}

                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {/* Unit Type Icon */}
                    <div className={`
                      w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold
                      ${unit.owner === "player" ? "bg-blue-600 text-white" : "bg-red-600 text-white"}
                    `}>
                      {unit.type === 'infantry' ? '⊠' :
                       unit.type === 'armor' ? '◯' :
                       unit.type === 'cavalry' ? '∇' : '⚡'}
                    </div>
                    <div>
                      <div className="font-bold text-[10px] md:text-xs leading-tight">{unit.name}</div>
                      <div className="text-[9px] md:text-[10px] opacity-75 capitalize">{unit.type}</div>
                    </div>
                  </div>
                  <span className={`text-[9px] md:text-[10px] uppercase font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${
                    unit.owner === "player" ? "bg-blue-600 text-white" : "bg-red-600 text-white"
                  }`}>
                    {unit.owner === "player" ? currentScenario.playerPolity : currentScenario.enemyPolity}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {unit.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="text-[9px] md:text-[10px] bg-amber-100 text-amber-800 px-1 md:px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  {unit.tags.length > 2 && (
                    <span className="text-[9px] md:text-[10px] text-amber-600">+{unit.tags.length - 2} more</span>
                  )}
                </div>

                {/* Status */}
                {unit.status && (
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                      unit.status === 'fresh' ? 'bg-green-500' :
                      unit.status === 'engaged' ? 'bg-orange-500' :
                      unit.status === 'wavering' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-[9px] md:text-[10px] opacity-80 uppercase tracking-wider">
                      {unit.status}
                    </span>
                  </div>
                )}

                {/* Position Info */}
                {unit.hex && (
                  <div className="text-[9px] md:text-[10px] opacity-60 mt-1">
                    Hex: ({unit.hex.q}, {unit.hex.r})
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}