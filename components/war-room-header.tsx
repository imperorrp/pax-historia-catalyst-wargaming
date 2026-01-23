"use client"

import { ChevronLeft, ChevronRight, Terminal, HelpCircle, PlusCircle, Signal, Wifi, WifiOff, AlertCircle } from "lucide-react"
import { ScenarioSwitcher } from "./scenario-switcher"
import { useTargetingStore } from "@/lib/targeting-store"
import { useAIStore } from "@/lib/ai/store"

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
  onOpenScenario: () => void
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
  onOpenScenario,
  isAnimating
}: WarRoomHeaderProps) {
  const { isMockMode, toggleMockMode, isLoading, provider, hasValidKey, selectedModel } = useAIStore()
  
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
                <div className="flex items-center gap-2 bg-amber-900/5 px-2 py-1 rounded-full border border-amber-900/10 relative group">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold font-serif text-amber-900 leading-none">
                      {isMockMode ? "MOCK DATA" : "AI MODE"}
                    </span>
                    <div className="flex flex-col items-end leading-none mt-0.5">
                      <span className="text-[8px] font-bold text-amber-800/80 uppercase tracking-wide">
                        {provider}
                      </span>
                      {!isMockMode && (
                        <span className="text-[7px] text-amber-700/60 font-mono max-w-[80px] truncate">
                          {selectedModel}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleMockMode()}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${
                      !isMockMode 
                        ? (hasValidKey() ? 'bg-emerald-600' : 'bg-red-500') 
                        : 'bg-amber-400'
                    }`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${!isMockMode ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  
                  {/* Invalid Key Warning */}
                  {!isMockMode && !hasValidKey() && (
                    <div className="absolute top-8 right-0 bg-red-50 text-red-600 text-[10px] px-2 py-1 rounded shadow-lg border border-red-200 z-50 whitespace-nowrap flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 min-w-[120px]">
                      <AlertCircle className="w-3 h-3" />
                      <span className="font-bold">Missing Valid API Key</span>
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-red-200 absolute -top-[6px] right-3"></div>
                    </div>
                  )}
                </div>
            )}

            <h1 className="font-serif text-sm md:text-lg font-bold text-amber-900 ml-2">COMMAND CENTER</h1>
            
            <div className={`hidden md:block text-[10px] md:text-xs font-serif font-bold px-1.5 md:px-2 py-0.5 rounded-full transition-colors ${
               isHistoricalView
                 ? "bg-stone-200 text-stone-600 ring-1 ring-stone-300"
                 : "bg-red-100 text-red-700 shadow-sm"
            }`}>
              R{currentRound}
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 flex-wrap">
            <div className="hidden md:block text-xs font-serif italic text-amber-800/70 border-r border-amber-900/10 pr-2">
              {currentScenario.playerPolity} vs {currentScenario.enemyPolity}
            </div>
            
            {/* History Navigation Controls */}
            <div className="flex items-center gap-0.5 bg-amber-900/5 p-0.5 rounded-lg border border-amber-900/5 mr-2">
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

            <button
              onClick={onToggleDebug}
              aria-label="Open System Console"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                debugMode
                  ? "bg-cyan-950 text-cyan-400 border border-cyan-500/50 shadow-lg shadow-cyan-900/20"
                  : "bg-amber-900/5 text-amber-800 hover:bg-amber-900/10"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span className="uppercase">CONSOLE</span>
            </button>

            <button
              onClick={onHelpOpen}
              aria-label="Open Help Guide"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-900/5 text-amber-800 hover:bg-amber-900/10 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="uppercase">HELP</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScenarioSwitcher />
          <button 
            onClick={onOpenScenario}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900 text-amber-50 rounded-lg text-xs font-bold hover:bg-amber-800 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">NEW SCENARIO</span>
          </button>
        </div>
      </div>
    </header>
  )
}