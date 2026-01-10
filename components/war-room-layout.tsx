"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WarRoomMap } from "./war-room-map"
import { UnitCounter } from "./unit-counter"
import { CatalystCard } from "./catalyst-card"
import { ScenarioSwitcher } from "./scenario-switcher"
import { useTargetingStore } from "@/lib/targeting-store"
import { Check, Maximize2, Minimize2, HelpCircle, ChevronUp, ChevronDown, Radio, ChevronLeft, ChevronRight, Rewind } from "lucide-react"
import { reconcileStateChanges, getInitialPayload } from "@/lib/game-loop"

export function WarRoomLayout() {
  const selectedTactic = useTargetingStore((state) => state.selectedTactic)
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

  const [logs, setLogs] = useState<string[]>(["Command Center initialized."])
  const [isLogExpanded, setIsLogExpanded] = useState(false)
  const [isStatusExpanded, setIsStatusExpanded] = useState(false)
  const [isMapMaximized, setIsMapMaximized] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const handleCommit = async () => {
    if (!selectedTactic || isAnimating) return

    setAnimating(true)
    console.log("[v0] Starting commit for tactic:", selectedTactic.id)

    const response = getInitialPayload(selectedTactic.id)
    if (!response) {
      console.error("[v0] Failed to get payload for tactic:", selectedTactic.id)
      setAnimating(false)
      return
    }

    console.log("[v0] AI Response received:", response)
    setGameResponse(response)

    setLogs((prev) => [
      ...prev,
      `>>> ROUND ${currentRound} - ${selectedTactic.title} executed`,
      `>>> ${response.narrative_update}`,
    ])

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const updatedScenario = reconcileStateChanges(currentScenario, response)
    console.log("[v0] Updated scenario:", updatedScenario)

    useTargetingStore.setState({
      currentScenario: updatedScenario,
    })

    saveToHistory(updatedScenario, response.narrative_update, selectedTactic)
    incrementRound()
    console.log("[v0] Round incremented to:", currentRound + 1)

    setTimeout(() => {
      reset()
      setGameResponse(null)
      setAnimating(false)
      console.log("[v0] Game state reset for next round")
    }, 500)
  }

  if (isMapMaximized) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-amber-100/30 to-amber-50 text-amber-900">
        <header className="border-b border-amber-900/10 bg-amber-50/60 backdrop-blur-sm px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm font-serif font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">
                ROUND {currentRound}
              </div>
              <h1 className="font-serif text-xl font-bold text-amber-900">COMMAND CENTER - Pax Historia</h1>
            </div>
            <button
              onClick={() => setIsMapMaximized(false)}
              className="p-2 hover:bg-amber-900/5 rounded-lg transition-colors text-amber-800"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <div className="w-full h-full bg-amber-50 border border-amber-900/10 overflow-hidden shadow-inner relative">
            <WarRoomMap scenario={currentScenario} />
            {currentScenario.units.map((unit) => (
              <UnitCounter key={unit.id} unit={unit} />
            ))}
          </div>
        </div>

        <div className="border-t border-amber-900/10 bg-amber-50/80 backdrop-blur-sm px-6 py-4 flex-shrink-0">
          <h3 className="text-xs font-serif font-bold text-amber-900 mb-3 uppercase tracking-wider">
            Tactical Options
          </h3>
          <div className="flex gap-3 justify-center flex-wrap max-h-28 overflow-y-auto">
            {currentScenario.options.map((option) => (
              <CatalystCard key={option.id} option={option} />
            ))}
          </div>
          {selectedTactic && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleCommit}
              className="w-full mt-3 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-serif font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Check className="w-4 h-4" />
              CONFIRM & ADVANCE ROUND
            </motion.button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-amber-100/30 to-amber-50 text-amber-900">
      <header className="border-b border-amber-900/10 bg-amber-50/60 backdrop-blur-sm px-6 py-4 flex-shrink-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h1 className="font-serif text-xl font-bold text-amber-900">COMMAND CENTER</h1>
              <div className="text-sm font-serif font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">
                ROUND {currentRound}
              </div>
              
              {/* History Navigation Controls */}
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={goToPreviousRound}
                  disabled={historyIndex === 0 || isAnimating}
                  className="p-1.5 rounded-md hover:bg-amber-900/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous Round"
                >
                  <ChevronLeft className="w-4 h-4 text-amber-700" />
                </button>
                <button
                  onClick={goToNextRound}
                  disabled={historyIndex === history.length - 1 || isAnimating}
                  className="p-1.5 rounded-md hover:bg-amber-900/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next Round"
                >
                  <ChevronRight className="w-4 h-4 text-amber-700" />
                </button>
                <span className="text-xs text-amber-700 ml-1 font-mono">
                  {historyIndex + 1}/{history.length}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-amber-800/70">
                {currentScenario.playerPolity} vs {currentScenario.enemyPolity}
              </div>
              <button
                onClick={() => setIsHelpOpen(true)}
                className="p-2 hover:bg-amber-900/10 rounded-lg transition-colors text-amber-800"
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
          <ScenarioSwitcher />
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Sidebar - Dispatch Log (collapsible, hidden on small) */}
        <div className="hidden sm:flex flex-col col-span-2 bg-amber-900/5 rounded-lg border border-amber-900/10 overflow-hidden backdrop-blur-sm">
          <button
            onClick={() => setIsLogExpanded(!isLogExpanded)}
            className="flex items-center justify-between gap-2 p-4 border-b border-amber-900/10 hover:bg-amber-900/5 transition-colors flex-shrink-0 group"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 flex-shrink-0 text-amber-700" />
              <h2 className="font-serif font-bold text-sm text-amber-900">DISPATCH</h2>
            </div>
            {isLogExpanded ? (
              <ChevronUp className="w-4 h-4 text-amber-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-700" />
            )}
          </button>

          {isLogExpanded && (
            <div className="flex-1 overflow-y-auto p-3 text-xs">
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
                      className="py-1.5 px-2.5 bg-amber-50/40 rounded border-l-2 border-amber-600/40 text-amber-900/70"
                    >
                      {log}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Center - Map (PRIMARY FOCAL POINT - LARGE) */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
          <div className="flex-1 bg-amber-50 rounded-lg border border-amber-900/15 overflow-hidden shadow-lg relative group">
            <WarRoomMap scenario={currentScenario} />
            {currentScenario.units.map((unit) => (
              <UnitCounter key={unit.id} unit={unit} />
            ))}

            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              onClick={() => setIsMapMaximized(true)}
              className="absolute top-4 right-4 p-2 bg-amber-900/10 hover:bg-amber-900/20 rounded-lg transition-colors z-10 text-amber-800 backdrop-blur-sm"
            >
              <Maximize2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Right Sidebar - Unit Status (collapsible, hidden on small) */}
        <div className="hidden lg:flex flex-col col-span-2 bg-amber-900/5 rounded-lg border border-amber-900/10 overflow-hidden backdrop-blur-sm">
          <button
            onClick={() => setIsStatusExpanded(!isStatusExpanded)}
            className="flex items-center justify-between gap-2 p-4 border-b border-amber-900/10 hover:bg-amber-900/5 transition-colors flex-shrink-0"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 flex-shrink-0 text-amber-700" />
              <h2 className="font-serif font-bold text-sm text-amber-900">UNITS</h2>
            </div>
            {isStatusExpanded ? (
              <ChevronUp className="w-4 h-4 text-amber-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-700" />
            )}
          </button>

          {isStatusExpanded && (
            <div className="flex-1 overflow-y-auto space-y-2 p-3">
              {currentScenario.units.map((unit) => (
                <motion.div
                  key={unit.id}
                  className={`
                    p-3 rounded-md text-xs border-l-4 transition-all font-serif relative
                    ${
                      unit.owner === "player"
                        ? "bg-blue-50/50 border-blue-500 text-blue-900"
                        : "bg-red-50/50 border-red-500 text-red-900"
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-sm">{unit.name}</div>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      unit.owner === "player" ? "bg-blue-600 text-white" : "bg-red-600 text-white"
                    }`}>
                      {unit.owner === "player" ? currentScenario.playerPolity : currentScenario.enemyPolity}
                    </span>
                  </div>
                  <div className="opacity-75 text-xs mt-1">{unit.type}</div>
                  {unit.status && (
                    <div className="text-xs mt-1 opacity-60 uppercase tracking-wider">Status: {unit.status}</div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tactical Hand - COMPACT, always visible */}
      <div className="border-t border-amber-900/10 bg-amber-50/60 backdrop-blur-sm flex-shrink-0">
        <div className="px-6 py-3 sm:py-4">
          <h3 className="text-xs font-serif font-bold text-amber-900 mb-3 uppercase tracking-wider">
            Tactical Options
          </h3>
          <div className="flex gap-3 justify-center flex-wrap max-h-32 overflow-y-auto pb-2">
            {currentScenario.options.map((option) => (
              <CatalystCard key={option.id} option={option} />
            ))}
          </div>

          {selectedTactic && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleCommit}
              className="w-full mt-3 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-serif font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
            >
              <Check className="w-4 h-4" />
              CONFIRM & ADVANCE ROUND
            </motion.button>
          )}
        </div>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  )
}

function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-amber-50 rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto border border-amber-900/20 backdrop-blur-sm"
          >
            <div className="p-6">
              <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4">War Room Guide</h2>

              <div className="space-y-4 text-amber-900/80 text-sm font-serif">
                <div>
                  <h3 className="font-bold text-amber-900 mb-1">What is the War Room?</h3>
                  <p>
                    The War Room is an interactive tactical command center where you issue strategic orders. Preview
                    maneuvers visually before committing to your next battle round.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-amber-900 mb-1">Scenarios</h3>
                  <p>
                    Switch between different historical scenarios at the top. Each has unique units, maps, and tactical
                    options.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-amber-900 mb-1">Main Map</h3>
                  <p>
                    The central parchment map shows all terrain regions, friendly units (blue), and enemy units (red).
                    Unit status rings show cohesion: solid=fresh, dashed=engaged, broken=wavering, grey=routing.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-amber-900 mb-1">Tactical Options</h3>
                  <p>
                    Click a tactic card to see arrows on the map showing the planned strategy. Click "CONFIRM & ADVANCE
                    ROUND" to execute the maneuver and advance to the next battle round.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-amber-900 mb-1">How to Command</h3>
                  <p>
                    1) Use scenario switcher to choose a battle
                    <br />
                    2) Click a tactic card (arrows appear on map)
                    <br />
                    3) Click "CONFIRM & ADVANCE ROUND" to execute and see results
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
