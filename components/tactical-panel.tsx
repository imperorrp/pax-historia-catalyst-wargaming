"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Target, ChevronUp, ChevronDown, AlertCircle } from "lucide-react"
import { CatalystCard } from "./catalyst-card"
import { useTargetingStore } from "@/lib/targeting-store"
import { useAIStore } from "@/lib/ai/store"

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
  const { isMockMode } = useAIStore()

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
              {currentScenario.options.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 text-amber-900/60 bg-amber-900/5 rounded-lg border border-dashed border-amber-900/20 my-2">
                  <AlertCircle className="w-5 h-5 mb-2 opacity-50" />
                  <p className="text-xs font-serif font-bold mb-1 text-center">
                    {isMockMode ? "END OF MOCK DATA" : "NO TACTICAL OPTIONS AVAILABLE"}
                  </p>
                  <p className="text-[10px] text-center max-w-xs leading-tight opacity-80">
                    {isMockMode 
                      ? "This simulation path has ended. Reset the scenario or switch to AI mode for infinite gameplay generation." 
                      : "The AI strategems have been exhausted. Check the console or reset the round."}
                  </p>
                </div>
              ) : (
                <div className="flex gap-1.5 md:gap-2 justify-center flex-wrap">
                  {currentScenario.options.map((option) => (
                    <CatalystCard
                      key={option.id}
                      option={option}
                      disabled={isHistoricalView}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}