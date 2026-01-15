"use client"

import { ChevronLeft, ChevronRight, Bug, HelpCircle } from "lucide-react"
import { ScenarioSwitcher } from "./scenario-switcher"
import { useTargetingStore } from "@/lib/targeting-store"

interface WarRoomHeaderProps {
  isHistoricalView: boolean
  currentRound: number
  historyIndex: number
  historyLength: number
  currentScenario: any
  debugMode: boolean
  onToggleDebug: () => void
  onHelpOpen: () => void
  onGoToPrevious: () => void
  onGoToNext: () => void
  isAnimating: boolean
}

export function WarRoomHeader({
  isHistoricalView,
  currentRound,
  historyIndex,
  historyLength,
  currentScenario,
  debugMode,
  onToggleDebug,
  onHelpOpen,
  onGoToPrevious,
  onGoToNext,
  isAnimating
}: WarRoomHeaderProps) {
  return (
    <header className="border-b border-amber-900/10 bg-amber-50/60 backdrop-blur-sm px-2 md:px-4 py-1 md:py-2 flex-shrink-0 relative">
      {/* Historical View Safety Banner */}
      {isHistoricalView && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 overflow-hidden">
           <div className="w-full h-full bg-stripes-amber animate-slide"></div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1 md:gap-2">
          <div className="flex items-center gap-1 md:gap-2 flex-wrap">
            {isHistoricalView ? (
               <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200 shadow-inner">
                  <div className="text-[8px] md:text-xs font-bold font-serif uppercase tracking-wider">Historical</div>
               </div>
            ) : (
               <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_6px_rgba(220,38,38,0.6)]" />
            )}

            <h1 className="font-serif text-sm md:text-lg font-bold text-amber-900">COMMAND CENTER</h1>
            <div className={`text-[10px] md:text-xs font-serif font-bold px-1.5 md:px-2 py-0.5 rounded-full transition-colors ${
               isHistoricalView
                 ? "bg-stone-200 text-stone-600 ring-1 ring-stone-300"
                 : "bg-red-100 text-red-700 shadow-sm"
            }`}>
              R{currentRound}
            </div>

            {/* History Navigation Controls */}
            <div className="flex items-center gap-0.5 bg-amber-900/5 p-0.5 rounded-lg border border-amber-900/5">
              <button
                onClick={onGoToPrevious}
                disabled={historyIndex === 0 || isAnimating}
                className="p-1 rounded hover:bg-white/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                title="Previous Round"
              >
                <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 text-amber-900" />
              </button>
              <div className="px-1 text-[8px] md:text-xs font-mono font-bold text-amber-900/60 min-w-[1.5rem] md:min-w-[2rem] text-center">
                 {historyIndex + 1}/{historyLength}
              </div>
              <button
                onClick={onGoToNext}
                disabled={historyIndex === historyLength - 1 || isAnimating}
                className="p-1 rounded hover:bg-white/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                title="Next Round"
              >
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-amber-900" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="hidden md:block text-xs font-serif italic text-amber-800/70 border-r border-amber-900/10 pr-2">
              {currentScenario.playerPolity} vs {currentScenario.enemyPolity}
            </div>
            <button
              onClick={onToggleDebug}
              className={`p-1.5 rounded-lg transition-colors ${
                debugMode
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  : "hover:bg-amber-900/10 text-amber-800"
              }`}
              title="Toggle Debug Mode"
            >
              <Bug className="w-4 h-4" />
            </button>
            <button
              onClick={onHelpOpen}
              className="p-1.5 hover:bg-amber-900/10 rounded-lg transition-colors text-amber-800"
              title="Help Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
        <ScenarioSwitcher />
      </div>
    </header>
  )
}