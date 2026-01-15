"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Target, ChevronUp, ChevronDown } from "lucide-react"
import { CatalystCard } from "./catalyst-card"
import { useTargetingStore } from "@/lib/targeting-store"

interface TacticalPanelProps {
  isExpanded: boolean
  onToggle: () => void
  currentScenario: any
  selectedTactic: any
  isHistoricalView: boolean
  onCommit: () => void
  isAnimating: boolean
}

export function TacticalPanel({
  isExpanded,
  onToggle,
  currentScenario,
  selectedTactic,
  isHistoricalView,
  onCommit,
  isAnimating
}: TacticalPanelProps) {
  return (
    <div className="border-t border-amber-900/10 bg-amber-50/60 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center justify-between gap-2 p-2 md:p-3 border-b border-amber-900/10 hover:bg-amber-900/5 transition-colors">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1"
        >
          <Target className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 text-amber-700" />
          <h2 className="font-serif font-bold text-[10px] md:text-xs text-amber-900">TACTICAL OPTIONS</h2>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 md:w-4 md:h-4 text-amber-700" />
          ) : (
            <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-amber-700" />
          )}
        </button>

        {selectedTactic && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onCommit}
            disabled={isAnimating}
            className="px-2 md:px-3 py-1 md:py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-serif font-bold rounded text-[7px] md:text-[8px] flex items-center gap-1 transition-colors shadow-sm"
          >
            <Check className="w-3 h-3" />
            CONFIRM AND ADVANCE TO NEXT ROUND
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-1.5 md:p-2">
              <div className="flex gap-1.5 md:gap-2 justify-center flex-wrap">
                {currentScenario.options.map((option) => (
                  <CatalystCard
                     key={option.id}
                     option={option}
                     disabled={isHistoricalView}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}