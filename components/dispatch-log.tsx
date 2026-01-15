"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Radio, ChevronUp, ChevronDown, Rewind } from "lucide-react"
import { useTargetingStore } from "@/lib/targeting-store"

interface DispatchLogProps {
  isExpanded: boolean
  onToggle: () => void
  history: any[]
  historyIndex: number
  logs: Array<{text: string, round: number}>
  currentRound: number
  onJumpToRound: (index: number) => void
  isHistoricalView: boolean
}

export function DispatchLog({
  isExpanded,
  onToggle,
  history,
  historyIndex,
  logs,
  currentRound,
  onJumpToRound,
  isHistoricalView
}: DispatchLogProps) {
  return (
    <div className="hidden lg:flex flex-col lg:col-span-3 col-span-2 bg-amber-900/5 rounded-lg border border-amber-900/10 overflow-hidden backdrop-blur-sm h-full">
      <button
        onClick={onToggle}
        className="flex items-center justify-between gap-2 p-2 md:p-3 border-b border-amber-900/10 hover:bg-amber-900/5 transition-colors flex-shrink-0 group"
      >
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 flex-shrink-0 text-amber-700" />
          <h2 className="font-serif font-bold text-xs md:text-sm text-amber-900">DISPATCH</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-amber-700" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-700" />
        )}
      </button>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-2 text-xs">
          {/* History Timeline */}
          <div className="space-y-1 mb-3">
            <div className="font-serif font-bold text-xs text-amber-900 mb-2 uppercase tracking-wider flex items-center gap-1">
              <Rewind className="w-3 h-3" />
              History
            </div>
            {history.map((entry, idx) => (
              <button
                key={idx}
                onClick={() => onJumpToRound(idx)}
                className={`w-full text-left py-1 px-2 rounded border-l-2 transition-all ${
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
              {logs
                .filter(log => !isHistoricalView || log.round <= currentRound)
                .map((log, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`py-1 px-2 rounded border-l-2 transition-all ${
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
      )}
    </div>
  )
}