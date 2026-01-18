"use client"

import { motion, AnimatePresence } from "framer-motion"

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
            className="bg-amber-50 rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto border border-amber-900/20 backdrop-blur-sm"
          >
            <div className="p-6">
              <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4">War Room Guide</h2>

              <div className="space-y-4 text-amber-900/80 text-sm font-serif">
                <div className="p-3 bg-amber-100/50 rounded-lg border border-amber-900/10">
                  <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider bg-amber-900 text-amber-50 px-2 py-0.5 rounded">Game Modes</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            <strong className="text-amber-900">AI (Live)</strong>
                        </div>
                        <p className="text-xs pl-4">
                            Uses a Large Language Model (GPT-4o or Gemini) to dynamically adjudicate battle outcomes. 
                            Results are unscripted and unique every time. <strong>Requires a valid API key</strong> in the Debug Console.
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <strong className="text-amber-900">Mock Data (Simulation)</strong>
                        </div>
                        <p className="text-xs pl-4">
                            Uses hardcoded, pre-scripted historical scenarios. No API key required. 
                            Useful for demonstrating the UI without cost. Note that these scenarios have a fixed end point.
                        </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-amber-900 mb-1">How to Command</h3>
                  <p>
                    1) <strong>Select a Scenario</strong>: Choose a historical battle from the top bar.
                    <br />
                    2) <strong>Review Map</strong>: Blue units are yours. Red are enemies. Rings indicate cohesion.
                    <br />
                    3) <strong>Issue Orders</strong>: Click a tactic card in the bottom panel. Arrows will visualize the maneuver.
                    <br />
                    4) <strong>Commit</strong>: Press "CONFIRM" to execute the turn. The AI (or Mock Engine) will resolve the outcome.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-amber-900 mb-1">Troubleshooting</h3>
                  <p>
                    If the "AI" mode shows an error badge, open the <strong>Console</strong> (terminal icon) and ensure your API Key is pasted correctly.
                    If the game stops in Mock Data mode, you have reached the end of the script—switch to AI for endless play.
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