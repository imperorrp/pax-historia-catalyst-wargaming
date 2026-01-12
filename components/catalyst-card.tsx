"use client"

import type { CatalystOption } from "@/lib/types"
import { motion } from "framer-motion"
import { useTargetingStore } from "@/lib/targeting-store"

interface CatalystCardProps {
  option: CatalystOption
}

export function CatalystCard({ option }: CatalystCardProps) {
  const { state, selectedTactic, reset, selectTactic } = useTargetingStore()
  const isActive = state !== "idle" && selectedTactic?.id === option.id

  const handleClick = () => {
    if (isActive) {
      reset()
    } else {
      selectTactic(option)
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className={`
        flex flex-col items-start justify-between p-3 rounded-lg
        border-2 transition-all flex-shrink-0
        sm:w-48 w-40 h-32
        ${
          isActive
            ? "bg-red-100 border-red-600 shadow-lg ring-2 ring-red-400"
            : "bg-amber-50/80 border-amber-400/60 shadow-sm hover:shadow-md hover:border-amber-500"
        }
      `}
    >
      <div className="text-left w-full">
        <h3 className="font-serif font-bold text-amber-900 text-sm leading-tight">{option.title}</h3>
        <p className="text-amber-800/70 text-xs mt-1.5 line-clamp-2">{option.description}</p>
      </div>

      {isActive && (
        <motion.div
          className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          PREVIEW ACTIVE
        </motion.div>
      )}
    </motion.button>
  )
}
