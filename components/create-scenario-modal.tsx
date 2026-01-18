"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTargetingStore } from "@/lib/targeting-store"
import { useAIStore } from "@/lib/ai/store"
import { Loader2, PlusCircle, X, Sparkles } from "lucide-react"

export function CreateScenarioModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void 
}) {
  const [prompt, setPrompt] = useState("")
  // Removed internal isOpen state since it's now controlled
  const setScenario = useTargetingStore(state => state.setScenario)
  const { isMockMode, provider, openaiKey, googleKey, selectedModel, scenarioSystemPrompt, toggleMockMode, setScenarioTransaction } = useAIStore()
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    if (isMockMode) {
        // Fallback for demo if in mock mode or no API key, but allow override if user confirms
        if(confirm("You are in Simulation Mode. Switch to Live Mode to generate real AI scenarios?")) {
           toggleMockMode();
        } else {
           setLoading(false)
           return
        }
    }

    try {
      const activeKey = provider === 'google' ? googleKey : openaiKey;

      const res = await fetch("/api/generate-scenario", {
        method: "POST",
        body: JSON.stringify({ 
          prompt,
          provider,
          apiKey: activeKey,
          model: selectedModel,
          systemPrompt: scenarioSystemPrompt
        }),
      })
      
      if (!res.ok) throw new Error("Generation failed")
      
      const data = await res.json()
      
      // Handle the debug info if present (since we changed the return type to Response.json)
      const scenarioData = data._debug ? { ...data, _debug: undefined } : data
      
      if (data._debug) {
         setScenarioTransaction(
            data._debug.userPrompt, 
            data._debug.systemPrompt, 
            scenarioData
         );
      } else {
         // Fallback for mock or old API
         setScenarioTransaction(
            `Generate scenario: ${prompt}`, 
            "System prompt unavailable (Mock Mode?)", 
            scenarioData
         );
      }

      const scenario = scenarioData
      if (scenario && scenario.id) {
          // Hydrate logic happens in store or we trust the API result complies with Schema
          setScenario(scenario) 
          onClose()
          setPrompt("")
      }
    } catch (e) {
      console.error(e)
      alert("Failed to generate scenario. Ensure you have a valid OPENAI_API_KEY in .env")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => !loading && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-amber-50 to-white rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-amber-200 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-amber-900/10 flex justify-between items-center bg-gradient-to-r from-amber-100/50 to-white/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-900 rounded-lg">
                    <Sparkles className="w-5 h-5 text-amber-50" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-amber-900">Commission New Scenario</h2>
                    <p className="text-xs text-amber-700/70">Create a custom battlefield with AI</p>
                  </div>
               </div>
               <button 
                  onClick={onClose} 
                  disabled={loading}
                  className="text-amber-900/50 hover:text-amber-900 hover:bg-amber-900/10 p-2 rounded-lg transition-colors disabled:opacity-30"
               >
                  <X className="w-5 h-5" />
               </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-sm">
                <p className="font-serif font-semibold text-amber-900 mb-2">Example Prompts:</p>
                <ul className="space-y-1 text-amber-800/90 text-xs">
                  <li className="italic">• "A frozen valley where rebels defend trenches against armored walkers"</li>
                  <li className="italic">• "Ancient Greek ships clash in a narrow strait during a storm"</li>
                  <li className="italic">• "Urban warfare in a ruined city with snipers and armored units"</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-serif font-semibold text-amber-900 mb-2">
                  Your Scenario Description
                </label>
                <textarea
                  placeholder="Describe the setting, factions, terrain, and key tactical elements..."
                  className="min-h-[140px] w-full p-4 rounded-xl border-2 border-amber-200 bg-white font-serif text-sm text-amber-900 placeholder:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-inner resize-none transition-all"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg font-bold border-2 border-amber-900/20 text-amber-900 hover:bg-amber-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate} 
                  disabled={loading || !prompt.trim()}
                  className={`flex-[2] py-3 rounded-lg font-bold font-serif flex justify-center items-center gap-2 transition-all ${
                      loading || !prompt.trim() 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-amber-700 to-amber-900 text-white hover:shadow-xl hover:scale-[1.02] shadow-lg'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>GENERATE BATTLEFIELD</span>
                    </>
                  )}
                </button>
              </div>

              {isMockMode && (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                   <p className="text-xs font-semibold text-yellow-800">
                     ⚠️ Simulation Mode Active
                   </p>
                   <p className="text-xs text-yellow-700 mt-1">
                     Switch to Live Mode and add OPENAI_API_KEY to generate real scenarios
                   </p>
                 </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
