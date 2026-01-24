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
  const { isMockMode, provider, openaiKey, googleKey, selectedModel, scenarioSystemPrompt, toggleMockMode, startTransaction, completeTransaction, failTransaction } = useAIStore()
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

    // 1. Prepare Telemetry ID
    const txId = startTransaction('SCENARIO_GEN', prompt);

    try {
      const activeKey = provider === 'google' ? googleKey : openaiKey;

      // Validate provider/model compatibility on the client to avoid roundtrip errors
      let providerToSend = provider;
      let apiKeyToSend = activeKey;

      if (provider === 'google' && selectedModel && selectedModel.toLowerCase().includes('gpt')) {
        const switchOk = confirm(`You currently selected Google as the provider but the model "${selectedModel}" looks like an OpenAI model. Press OK to switch provider to 'openai' for this request, or Cancel to change your selected model in Settings.`)
        if (switchOk) {
          providerToSend = 'openai';
          apiKeyToSend = openaiKey;
        } else {
          setLoading(false);
          failTransaction(txId, "Aborted by user (Model Mismatch)");
          alert('Scenario generation aborted. Select a compatible Google model (e.g., gemini-1.5-pro) or switch provider to OpenAI.');
          return;
        }
      }

      const res = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          provider: providerToSend,
          apiKey: apiKeyToSend,
          model: selectedModel,
          systemPrompt: scenarioSystemPrompt
        }),
      })
      
      const text = await res.text();
      if (!res.ok) {
        // Try to parse a structured error, otherwise include raw text
        let errMsg = text;
        try { errMsg = JSON.parse(text).error || text } catch { /* ignore */ }
        throw new Error(`Generation failed (${provider}): ${errMsg}`)
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
         // This is often where "text before json" fails if strict mode didn't catch it
         throw new Error("Received invalid JSON from AI. Check Telemetry for raw output.");
      }
      
      // Optional: expose raw model output for debugging
      if (data?.raw) {
        console.debug("AI Raw Output:", data.raw);
      }
      
      // CRITICAL FIX: Save the prompts for the Debug Panel
      if (data.systemPrompt) {
         useAIStore.getState().setLastPrompts(
            'SCENARIO', 
            prompt,
            data.systemPrompt
         );
      }

      // 4. Log Success
      completeTransaction(txId, data);
      
      // Extract the actual scenario payload (API now wraps it in 'data' field)
      const scenarioPayload = data.data || data;
      
      // Handle the debug info if present
      const scenarioData = scenarioPayload._debug ? { ...scenarioPayload, _debug: undefined } : scenarioPayload
      
      const scenario = scenarioData
      if (scenario && scenario.id) {
          // Hydrate logic happens in store or we trust the API result complies with Schema
          setScenario(scenario) 
          onClose()
          setPrompt("")
      } else {
          throw new Error("No scenario ID returned");
      }
    } catch (e: any) {
      console.error(e)
      // 5. Log Failure
      failTransaction(txId, e.message || String(e));
      // Show clearer provider-aware error message with pointer to Telemetry
      alert(`Failed to generate scenario.\n\nError: ${e?.message || String(e)}\n\nPlease check the "System Console" > "Telemetry" tab to see the raw response from the AI.`)
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
            className="bg-gradient-to-br from-amber-50 to-white rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-amber-200 overflow-hidden flex flex-col max-h-[85vh]"
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

                    {/* Provider / Model Badge */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="text-[10px] font-bold font-serif text-amber-900 leading-none">
                        {isMockMode ? "MOCK DATA" : "AI MODE"}
                      </div>
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-[8px] font-bold text-amber-800/80 uppercase tracking-wide">{provider}</span>
                        {!isMockMode && (
                          <span className="text-[7px] text-amber-700/60 font-mono max-w-[220px] truncate">{selectedModel}</span>
                        )}
                      </div>
                    </div>
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
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-sm">
                <p className="font-serif font-semibold text-amber-900 mb-2">Example Prompts:</p>
                <ul className="space-y-1 text-amber-800/90 text-xs">
                  <li className="italic">• "A frozen valley where rebels defend trenches against armored walkers"</li>
                  <li className="italic">• "Ancient Greek ships clash in a narrow strait during a storm"</li>
                  <li className="italic">• "Urban warfare in a ruined city with snipers and armored units"</li>
                  <li className="italic">• "Steam-powered mechs defending a Victorian london bridge against sea monsters"</li>
                  <li className="italic">• "Samurai archers holding a mountain pass against a modern tank battalion"</li>
                  <li className="italic">• "Prehistoric dinosaur riders clashing with alien invaders in a jungle"</li>
                  <li className="italic">• "Battle for a resource silo on Mars during a dust storm"</li>
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
