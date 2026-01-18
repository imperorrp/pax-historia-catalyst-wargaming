"use client"

import type { CatalystOption } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { useTargetingStore } from "@/lib/targeting-store"
import { useAIStore } from "@/lib/ai/store"
import { useState } from "react"

interface CatalystCardProps {
  option: CatalystOption
  disabled?: boolean
}

export function CatalystCard({ option, disabled = false }: CatalystCardProps) {
  const { state, selectedTactic, reset, selectTactic } = useTargetingStore()
  const { isMockMode } = useAIStore()
  const isActive = state !== "idle" && selectedTactic?.id === option.id
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (disabled) return
    if (isActive) {
      reset()
    } else {
      selectTactic(option)
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={disabled ? {} : { y: -3 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      disabled={disabled}
      className={`
        relative group flex flex-col items-start justify-between p-2 rounded-lg
        border-2 transition-all flex-shrink-0 cursor-pointer overflow-hidden
        sm:w-52 w-44 min-h-[4.5rem]
        ${disabled 
            ? "opacity-50 cursor-not-allowed grayscale bg-gray-100 border-gray-300"
            : isActive
              ? "bg-red-100 border-red-600 shadow-lg ring-2 ring-red-400"
              : "bg-amber-50/80 border-amber-400/60 shadow-sm hover:shadow-md hover:border-amber-500 hover:bg-amber-50"
        }
      `}
    >
      {isMockMode && (
         <div className="absolute top-0 right-0 py-0.5 px-1.5 bg-amber-100 text-[8px] font-mono font-bold text-amber-800 border-l border-b border-amber-200 shadow-sm z-20 rounded-bl-md" title="This action is pre-scripted">MOCK</div>
      )}

      <div className="text-left w-full h-full flex flex-col">
        <h3 className={`font-serif font-bold text-xs leading-tight transition-colors ${
          disabled ? "text-gray-600" : "text-amber-900"
        }`}>
          {option.title}
        </h3>
        <p className={`text-[10px] mt-1 transition-colors flex-grow ${
           disabled ? "text-gray-500" : "text-amber-800/80"
        }`}>
          {option.description}
        </p>
      </div>

      {isActive && !disabled && (
        <motion.div
          className="text-[10px] font-bold tracking-wide text-red-700 bg-red-50 px-2 py-0.5 rounded mt-2 uppercase inline-block border border-red-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Preview Active
        </motion.div>
      )}

      {/* Expanded Hover View for Long Text (Tooltip style overlay) */}
      <AnimatePresence>
        {isHovered && !disabled && (
          <motion.div
             initial={{ opacity: 0, scale: 0.98, y: 5 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.98, y: 5 }}
             transition={{ duration: 0.15 }}
             className="absolute left-[-2px] right-[-2px] bottom-full mb-2 bg-amber-50 border border-amber-900/10 shadow-xl rounded-lg p-3 z-50 text-left pointer-events-none"
             style={{
               boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)"
             }}
          >
             <h3 className="font-serif font-bold text-amber-900 text-sm mb-1">{option.title}</h3>
             <p className="text-amber-800/90 text-xs leading-relaxed">{option.description}</p>
             {/* Small arrow pointing down */}
             <div className="absolute left-4 -bottom-1 w-2 h-2 bg-amber-50 border-r border-b border-amber-900/10 transform rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

