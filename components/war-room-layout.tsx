"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WarRoomMap } from "./war-room-map"
import { CatalystCard } from "./catalyst-card"
import { DebugPanel } from "./debug-panel"
import { WarRoomHeader } from "./war-room-header"
import { TacticalPanel } from "./tactical-panel"
import { DispatchLog } from "./dispatch-log"
import { UnitsPanel } from "./units-panel"
import { HelpModal } from "./help-modal"
import { CreateScenarioModal } from "./create-scenario-modal"
import { useTargetingStore } from "@/lib/targeting-store"
import { SCENARIOS } from "@/lib/mock-data/scenarios"
import { useAIStore } from "@/lib/ai/store"
import { resolveTurn, reconcileStateChanges } from "@/lib/game-loop"
import { Check, Maximize2, Minimize2, HelpCircle, ChevronUp, ChevronDown, Radio, ChevronLeft, ChevronRight, Rewind, Target, Bug, AlertCircle } from "lucide-react"

export function WarRoomLayout() {
  const selectedTactic = useTargetingStore((state) => state.selectedTactic)
  const selectedUnit = useTargetingStore((state) => state.selectedUnit)
  const currentRound = useTargetingStore((state) => state.currentRound)
  const currentScenario = useTargetingStore((state) => state.currentScenario)
  const isAnimating = useTargetingStore((state) => state.isAnimating)
  const history = useTargetingStore((state) => state.history)
  const historyIndex = useTargetingStore((state) => state.historyIndex)

  const reset = useTargetingStore((state) => state.reset)
  const incrementRound = useTargetingStore((state) => state.incrementRound)
  const setGameResponse = useTargetingStore((state) => state.setGameResponse)
  const setAnimating = useTargetingStore((state) => state.setAnimating)
  const saveToHistory = useTargetingStore((state) => state.saveToHistory)
  const goToPreviousRound = useTargetingStore((state) => state.goToPreviousRound)
  const goToNextRound = useTargetingStore((state) => state.goToNextRound)
  const jumpToRound = useTargetingStore((state) => state.jumpToRound)
  const debugMode = useTargetingStore((state) => state.debugMode)
  const toggleDebugMode = useTargetingStore((state) => state.toggleDebugMode)
  // removed simulatePrompt as resolveTurn handles it

  const [logs, setLogs] = useState<Array<{text: string, round: number, source?: 'system' | 'mock' | 'ai'}>>([{text: "Command Center initialized.", round: 0, source: 'system'}])
  const [isLogExpanded, setIsLogExpanded] = useState(true)
  const [isStatusExpanded, setIsStatusExpanded] = useState(true)
  const [isMapMaximized, setIsMapMaximized] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false)
  const unitsSidebarRef = useRef<HTMLDivElement>(null)
  const [isTacticalExpanded, setIsTacticalExpanded] = useState(true)

  // Prevent hydration mismatch for procedurally generated maps: only render after client mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isHistoricalView = historyIndex < history.length - 1

  // Auto-open units sidebar and scroll to selected unit
  useEffect(() => {
    if (selectedUnit && !isStatusExpanded) {
      setIsStatusExpanded(true)
    }
    
    if (selectedUnit && unitsSidebarRef.current) {
      // Find the selected unit element and scroll to it
      const unitElements = unitsSidebarRef.current.querySelectorAll('[data-unit-id]')
      const selectedElement = Array.from(unitElements).find(el => 
        el.getAttribute('data-unit-id') === selectedUnit.id
      ) as HTMLElement
      
      if (selectedElement) {
        selectedElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }
    }
  }, [selectedUnit, isStatusExpanded])

  // Reset logs when scenario changes
  useEffect(() => {
    const isMockScenario = Object.values(SCENARIOS).some(s => s.id === currentScenario.id)
    const meta = `Scenario: ${currentScenario.name} | Era: ${currentScenario.era} | Player: ${currentScenario.playerPolity} | Enemy: ${currentScenario.enemyPolity} | Map: ${currentScenario.mapDimensions?.width ?? '?'}x${currentScenario.mapDimensions?.height ?? '?'}`
    setLogs([
      { text: `Command Center initialized for: ${currentScenario.name}`, round: 0, source: 'system' },
      { text: meta, round: 0, source: 'system' },
      // Inject the Narrative Intro if present. Use 'mock' source for built-in scenarios.
      ...(currentScenario.options && (currentScenario as any).narrative_intro ? [{
          text: `Narrative Intro: ${(currentScenario as any).narrative_intro}`,
          round: 0,
          source: isMockScenario ? 'mock' : 'ai'
      }] : [])
    ])
  }, [currentScenario.id])

  const handleCommit = async () => {
    if (!selectedTactic || isAnimating) return

    setAnimating(true)
    console.log("[v0] Starting commit for tactic:", selectedTactic.id)

    // Retrieve global AI config 
    const aiState = useAIStore.getState();
    
    let payload: any = null;

    try {
        // Use the centralized game loop logic which handles Mock vs Live modes correctly
        // This function also handles updating the Transaction Store/Debug Panel
        payload = await resolveTurn(selectedTactic.id, currentRound, currentScenario, selectedTactic);
    } catch (e) {
        console.error("AI Turn failed", e);
        setAnimating(false);
        return;
    }

    if (!payload) {
      console.error("[v0] Failed to get payload for tactic:", selectedTactic.id)
      setAnimating(false)
      return
    }

    // Continue with existing game logic using the new payload
    const response = payload;

    console.log("[v0] AI Response received:", response)
    setGameResponse(response)

    const narrative = response.narrative_outcome ?? response.narrative_update ?? response.narrative ?? '(no narrative)';

    setLogs((prev) => [
      ...prev,
      { text: `>>> ROUND ${currentRound} - ${selectedTactic.title} executed`, round: currentRound, source: 'system' },
      // Include the tactical option's full description for clarity
      { text: `>>> ${selectedTactic.description}`, round: currentRound, source: 'system' },
      { text: `>>> ${narrative}`, round: currentRound, source: aiState.isMockMode ? 'mock' : 'ai' },
    ])

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const updatedScenario = reconcileStateChanges(currentScenario, response)
    console.log("[v0] Updated scenario:", updatedScenario)

    useTargetingStore.setState({
      currentScenario: updatedScenario,
    })

    saveToHistory(updatedScenario, narrative, selectedTactic)
    incrementRound()
    console.log("[v0] Round incremented to:", currentRound + 1)

    setTimeout(() => {
      reset()
      setGameResponse(null)
      setAnimating(false)
      console.log("[v0] Game state reset for next round")
    }, 500)
  }

  if (!mounted) return <div className="h-screen w-screen bg-amber-50" />

  if (isMapMaximized) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-amber-50 via-amber-100/30 to-amber-50 text-amber-900"
        style={{ width: '100vw', height: '100vh' }}
      >
        {/* Fullscreen Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMapMaximized(false)}
            className="p-3 bg-amber-900/90 hover:bg-amber-900 text-white rounded-lg transition-colors shadow-lg backdrop-blur-sm border border-amber-700/50"
            title="Exit Fullscreen"
          >
            <Minimize2 className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Fullscreen Map */}
        <div className="w-full h-full bg-amber-50 border border-amber-900/10 overflow-hidden shadow-inner relative">
          <WarRoomMap scenario={currentScenario} />
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-amber-100/30 to-amber-50 text-amber-900">
      <WarRoomHeader
        isHistoricalView={isHistoricalView}
        currentRound={currentRound}
        historyIndex={historyIndex}
        historyLength={history.length}
        currentScenario={currentScenario}
        debugMode={debugMode}
        onToggleDebug={toggleDebugMode}
        onHelpOpen={() => setIsHelpOpen(true)}
        onGoToPrevious={goToPreviousRound}
        onOpenScenario={() => setIsScenarioModalOpen(true)}
        onGoToNext={goToNextRound}
        isAnimating={isAnimating}
      />

      {/* Main Content Grid */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-2 md:gap-3 p-2 md:p-3 overflow-y-auto lg:overflow-hidden">
        
        {/* MOBILE LAYOUT: Vertical Stack */}
        {/* Map Section - Visible on mobile first */}
        <div className="lg:hidden flex flex-col bg-amber-50 rounded-lg border border-amber-900/15 overflow-hidden shadow-lg relative touch-none" style={{ height: '400px', flexShrink: 0 }}>
          <WarRoomMap scenario={currentScenario} />
          
          <motion.button
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMapMaximized(true)}
            className="absolute top-4 right-4 p-3 bg-amber-900/80 hover:bg-amber-900 text-white rounded-lg transition-all duration-200 z-10 shadow-lg backdrop-blur-sm border border-amber-700/50"
            title="Fullscreen Map"
          >
            <Maximize2 className="w-6 h-6" />
          </motion.button>
        </div>

        {/* MOBILE: Tactical Options - No scrolling, full content */}
        <div className="lg:hidden border-t border-amber-900/10 bg-amber-50/60 backdrop-blur-sm flex-shrink-0 rounded-lg">
          <div className="flex items-center justify-between gap-2 p-3 border-b border-amber-900/10 bg-amber-900/5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 flex-shrink-0 text-amber-700" />
              <h2 className="font-serif font-bold text-sm text-amber-900">TACTICAL OPTIONS</h2>
            </div>
          </div>
          <div className="px-3 py-3">
             {currentScenario.options.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 text-amber-900/60 bg-amber-900/5 rounded-lg border border-dashed border-amber-900/20">
                  <AlertCircle className="w-5 h-5 mb-2 opacity-50" />
                  <p className="text-xs font-serif font-bold mb-1 text-center">END OF PRESET DATA</p>
                  <p className="text-[10px] text-center max-w-xs leading-tight opacity-80">
                     No more tactical options in this simulation. Reset or switch to AI.
                  </p>
                </div>
            ) : (
              <div className="flex gap-2 justify-start flex-wrap">
                {currentScenario.options.map((option) => (
                  <CatalystCard 
                     key={option.id} 
                     option={option} 
                     disabled={isHistoricalView}
                  />
                ))}
            </div>
            )}
            {selectedTactic && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleCommit}
                disabled={isAnimating}
                className="w-full mt-3 py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-serif font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <Check className="w-4 h-4" />
                CONFIRM & ADVANCE ROUND
              </motion.button>
            )}
          </div>
        </div>

        {/* MOBILE: Dispatch Log with min-height and scroll */}
        <div className="lg:hidden flex flex-col bg-amber-900/5 rounded-lg border border-amber-900/10 overflow-hidden backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between gap-2 p-3 border-b border-amber-900/10 bg-amber-900/5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 flex-shrink-0 text-amber-700" />
              <h2 className="font-serif font-bold text-sm text-amber-900">DISPATCH LOG</h2>
            </div>
          </div>

          <div className="overflow-y-auto p-3 text-xs" style={{ minHeight: '200px', maxHeight: '300px' }}>
                  {/* History Timeline */}
                  <div className="space-y-1 mb-3">
                    <div className="font-serif font-bold text-xs text-amber-900 mb-2 uppercase tracking-wider flex items-center gap-1">
                      <Rewind className="w-3 h-3" />
                      History
                    </div>
                    {history.map((entry, idx) => (
                      <button
                        key={idx}
                        onClick={() => jumpToRound(idx)}
                        className={`w-full text-left py-1.5 px-2.5 rounded border-l-2 transition-all ${
                          idx === historyIndex
                            ? "bg-amber-600/20 border-amber-600 text-amber-900 font-semibold"
                            : "bg-amber-50/40 border-amber-600/40 text-amber-900/70 hover:bg-amber-100/60"
                        }`}
                      >
                        <div className="font-mono text-xs">R{entry.round}</div>
                        {entry.tacticUsed && (
                          <div className="text-xs opacity-75 truncate">{entry.tacticUsed.title}</div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Regular Logs */}
                  <div className="font-serif font-bold text-xs text-amber-900 mb-2 uppercase tracking-wider">
                    Dispatch Log
                  </div>
                  <div className="space-y-2 font-mono text-amber-800/80">
                    <AnimatePresence mode="popLayout">
                      {logs.map((log, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className={`py-1.5 px-2.5 rounded border-l-2 transition-all ${
                            log.round === currentRound
                              ? "bg-amber-200/60 border-amber-600 text-amber-950 font-semibold shadow-sm"
                              : log.round === currentRound - 1
                              ? "bg-amber-100/50 border-amber-500 text-amber-900/90"
                              : "bg-amber-50/40 border-amber-600/40 text-amber-900/70"
                          }`}
                        >
                          {log.text}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
        </div>

        {/* MOBILE: Units Panel - Always visible on mobile */}
        <div className="lg:hidden flex flex-col bg-amber-900/5 rounded-lg border border-amber-900/10 overflow-hidden backdrop-blur-sm flex-shrink-0 mb-4">
          <div className="flex items-center justify-between gap-2 p-3 border-b border-amber-900/10 bg-amber-900/5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 flex-shrink-0 text-amber-700" />
              <h2 className="font-serif font-bold text-sm text-amber-900">UNITS</h2>
            </div>
          </div>

          <div className="overflow-y-auto space-y-1.5 p-2" style={{ maxHeight: '400px' }}>
                  {currentScenario.units.map((unit) => {
                    const isSelected = selectedUnit?.id === unit.id
                    return (
                      <motion.div
                        key={unit.id}
                        data-unit-id={unit.id}
                        onClick={() => useTargetingStore.getState().selectUnit(unit)}
                        className={`
                          p-2 rounded-lg text-[10px] border-l-4 transition-all font-serif relative cursor-pointer
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
                            <div className={`
                              w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                              ${unit.owner === "player" ? "bg-blue-600 text-white" : "bg-red-600 text-white"}
                            `}>
                              {unit.type === 'infantry' ? '⊠' : 
                               unit.type === 'armor' ? '◯' : 
                               unit.type === 'cavalry' ? '∇' : '⚡'}
                            </div>
                            <div>
                              <div className="font-bold text-xs leading-tight">{unit.name}</div>
                              <div className="text-[10px] opacity-75 capitalize">{unit.type}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                            unit.owner === "player" ? "bg-blue-600 text-white" : "bg-red-600 text-white"
                          }`}>
                            {unit.owner === "player" ? currentScenario.playerPolity : currentScenario.enemyPolity}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {unit.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                          {unit.tags.length > 2 && (
                            <span className="text-[10px] text-amber-600">+{unit.tags.length - 2}</span>
                          )}
                        </div>

                        {unit.status && (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              unit.status === 'fresh' ? 'bg-green-500' :
                              unit.status === 'engaged' ? 'bg-orange-500' :
                              unit.status === 'wavering' ? 'bg-red-500' : 'bg-gray-500'
                            }`} />
                            <span className="text-[10px] opacity-80 uppercase tracking-wider">
                              {unit.status}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
        </div>

        {/* DESKTOP LAYOUT: Original 3-column grid */}
        {/* Left Sidebar - Dispatch Log (collapsible) */}
        <div className="lg:col-span-2 h-full min-h-0">
          <DispatchLog
            isExpanded={isLogExpanded}
            onToggle={() => setIsLogExpanded(!isLogExpanded)}
            history={history}
            historyIndex={historyIndex}
            logs={logs}
            currentRound={currentRound}
            onJumpToRound={jumpToRound}
            isHistoricalView={isHistoricalView}
          />
        </div>

        {/* Center - Map (PRIMARY FOCAL POINT - LARGE) */}
        <div className="hidden lg:flex lg:col-span-8 flex-col h-full min-h-0 overflow-hidden order-first lg:order-none">
          <div className="flex-1 bg-amber-50 rounded-lg border border-amber-900/15 shadow-lg relative group min-h-[300px] lg:min-h-0">
            <WarRoomMap scenario={currentScenario} />

            <motion.button
              initial={{ opacity: 0.7 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMapMaximized(true)}
              className="absolute top-4 right-4 p-3 bg-amber-900/80 hover:bg-amber-900 text-white rounded-lg transition-all duration-200 z-10 shadow-lg backdrop-blur-sm border border-amber-700/50"
              title="Fullscreen Map"
            >
              <Maximize2 className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {/* Right Sidebar - Unit Status (collapsible) */}
        <div className="lg:col-span-2 h-full min-h-0">
          <UnitsPanel
            isExpanded={isStatusExpanded}
            onToggle={() => setIsStatusExpanded(!isStatusExpanded)}
            currentScenario={currentScenario}
            selectedUnit={selectedUnit}
          />
        </div>
      </div>

      {/* Tactical Hand - Collapsible Panel (Desktop Only) */}
      <div className="hidden lg:block">
        <TacticalPanel
          isExpanded={isTacticalExpanded}
          onToggle={() => setIsTacticalExpanded(!isTacticalExpanded)}
          currentScenario={currentScenario}
          selectedTactic={selectedTactic}
          isHistoricalView={isHistoricalView}
          onCommit={handleCommit}
          isAnimating={isAnimating}
        />
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <CreateScenarioModal isOpen={isScenarioModalOpen} onClose={() => setIsScenarioModalOpen(false)} />
      
      {/* Debug Panel */}
      <AnimatePresence>
        {debugMode && (
          <DebugPanel 
            scenario={currentScenario} 
            selectedTactic={selectedTactic}
            onClose={toggleDebugMode}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
