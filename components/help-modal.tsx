"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
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
            className="bg-amber-50 rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-amber-900/20 backdrop-blur-sm relative"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              aria-label="Close Help"
              className="sticky top-3 right-3 float-right p-2 rounded-md text-amber-700 hover:bg-amber-100/60 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-6 pr-14">
              <h2 className="text-3xl font-serif font-bold text-amber-900 mb-6">Wargaming Prototype Operations Manual</h2>

              <div className="space-y-5 text-amber-900/80 text-sm font-serif">
                
                {/* Game Modes */}
                <div className="p-4 bg-amber-100/50 rounded-lg border border-amber-900/10">
                  <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-base">
                    <span className="text-xs uppercase tracking-wider bg-amber-900 text-amber-50 px-2 py-0.5 rounded">Game Modes</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            <strong className="text-amber-900">AI (Live)</strong>
                        </div>
                        <p className="text-xs pl-4">
                            Powered by LLMs (GPT-4o, Gemini). AI dynamically adjudicates combat, morale, terrain effects, and tactical outcomes. 
                            Every battle is unique and emergent. <strong>Requires API key</strong> configured in Debug Console → Config tab.
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <strong className="text-amber-900">Mock Data (Simulation)</strong>
                        </div>
                        <p className="text-xs pl-4">
                            Pre-scripted historical scenarios. No API key needed—instant setup. 
                            Useful for UI demonstration and learning mechanics. Limited to fixed narrative endpoints.
                        </p>
                    </div>
                  </div>
                </div>

                {/* Interface Layout */}
                <div>
                  <h3 className="font-bold text-amber-900 mb-2 text-base border-b border-amber-900/20 pb-1">Interface Layout</h3>
                  <div className="space-y-3 pl-2">
                    <div>
                      <strong className="text-amber-900">Header Bar (Top)</strong>
                      <p className="text-xs mt-0.5">
                        <strong>Scenario Selector:</strong> Switch between historical battles (Austerlitz, Trafalgar, Blitzkrieg, etc.). 
                        <strong> Round Indicator:</strong> Shows current turn number. 
                        <strong> Help & Debug:</strong> Access this guide or open the technical console.
                      </p>
                    </div>
                    <div>
                      <strong className="text-amber-900">Dispatch Log (Left Panel)</strong>
                      <p className="text-xs mt-0.5">
                        Real-time battle reports and narrative updates. Tracks combat outcomes, morale shifts, terrain impacts, and AI reasoning. 
                        Use <strong>timeline arrows</strong> to review previous rounds. Collapsible on desktop.
                      </p>
                    </div>
                    <div>
                      <strong className="text-amber-900">Battlefield Map (Center)</strong>
                      <p className="text-xs mt-0.5">
                        Hex-based tactical display with hand-drawn aesthetics. Shows unit positions, terrain features, status rings, and visual effects. 
                        <strong>Click units</strong> to inspect details. <strong>Maximize button</strong> (top-right) for fullscreen view. 
                        <strong>Legend icon</strong> displays all visual actions and effects reference.
                      </p>
                    </div>
                    <div>
                      <strong className="text-amber-900">Units Panel (Right Panel)</strong>
                      <p className="text-xs mt-0.5">
                        Lists all deployed forces with strength, morale, and cohesion. 
                        <strong>Blue units:</strong> friendly. <strong>Red units:</strong> hostile. Click any unit for detailed inspection. Collapsible on desktop.
                      </p>
                    </div>
                    <div>
                      <strong className="text-amber-900">Tactical Hand (Bottom Panel)</strong>
                      <p className="text-xs mt-0.5">
                        Your command options. Select a tactic card (Advance, Charge, Fortify, etc.), choose target hex, then <strong>CONFIRM ORDER</strong> to execute. 
                        Visual action preview arrows appear on map. Swipe or scroll through available tactics.
                      </p>
                    </div>
                    <div>
                      <strong className="text-amber-900">Debug Console (Terminal Icon)</strong>
                      <p className="text-xs mt-0.5">
                        <strong>Config Tab:</strong> Set AI provider, model, and API keys. Toggle Mock/AI modes. 
                        <strong>Telemetry Tab:</strong> Monitor API calls and execution history. 
                        <strong>Prompt Tab:</strong> View system instructions and knowledge base. 
                        <strong>Data Tab:</strong> Inspect raw JSON scenario data and copy for debugging.
                      </p>
                    </div>
                  </div>
                </div>

                {/* How to Play */}
                <div>
                  <h3 className="font-bold text-amber-900 mb-2 text-base border-b border-amber-900/20 pb-1">How to Play</h3>
                  <ol className="space-y-2 pl-2">
                    <li className="text-xs">
                      <strong>1. Choose Your Battle:</strong> Select a scenario from the header dropdown. Each represents a different historical engagement with unique forces and terrain.
                    </li>
                    <li className="text-xs">
                      <strong>2. Assess the Situation:</strong> Study the map. Note unit positions, terrain features (forests, hills, rivers), and enemy formations. Review the Dispatch Log for context.
                    </li>
                    <li className="text-xs">
                      <strong>3. Plan Your Move:</strong> Open the Tactical Hand. Browse available tactics—offensive (Charge, Flanking), defensive (Fortify, Hold), or special (Artillery Barrage, Rally).
                    </li>
                    <li className="text-xs">
                      <strong>4. Issue Orders:</strong> Click a tactic card. Visual arrows preview the action. Select target hex if needed (hover over map to choose). Cancel or confirm your selection.
                    </li>
                    <li className="text-xs">
                      <strong>5. Execute Turn:</strong> Press <strong>CONFIRM ORDER</strong>. The AI resolves combat, morale checks, and narrative outcomes. New dispatch entries appear in the log.
                    </li>
                    <li className="text-xs">
                      <strong>6. Adapt & Continue:</strong> React to AI outcomes. Units may gain/lose cohesion, rout, or prevail. Adjust strategy and issue next turn's orders. Repeat until victory or defeat.
                    </li>
                  </ol>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}