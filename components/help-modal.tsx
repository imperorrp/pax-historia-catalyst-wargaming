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