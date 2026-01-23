"use client"

import { useTargetingStore } from "@/lib/targeting-store"
import { SCENARIOS } from "@/lib/mock-data/scenarios"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"

export function ScenarioSwitcher() {
  const { currentScenario, setScenario, availableScenarios } = useTargetingStore()

  return (
    <div className="flex items-center gap-2">
      <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0" />
      <div className="flex gap-2 overflow-x-auto max-w-[50vw] md:max-w-[40vw] pb-1 scrollbar-hide">
        {availableScenarios.map((scenario) => (
          <motion.button
            key={scenario.id}
            onClick={() => setScenario(scenario)}
            className={`
              px-3 py-1.5 rounded-lg font-serif text-xs font-bold transition-all whitespace-nowrap
              ${
                currentScenario?.id === scenario.id
                  ? "bg-amber-900 text-amber-50 shadow-md"
                  : "bg-amber-900/10 text-amber-900 hover:bg-amber-900/20"
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {scenario.name.split(":")[0]}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
