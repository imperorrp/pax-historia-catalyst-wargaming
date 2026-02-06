"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight, X, Terminal, GripVertical, Settings, Database, MessageSquare, CheckCircle2, AlertTriangle, Loader2, AlertCircle, Clock, BrainCircuit, FileJson, Copy } from "lucide-react"
import type { WarRoomScenario, CatalystOption } from "@/lib/types"
import { useAIStore } from "@/lib/ai/store"
import { useTargetingStore } from "@/lib/targeting-store"
import { ScenarioGenerationSchema, TurnResolutionSchema } from "@/lib/ai/schemas"
import { buildTurnPrompt } from "@/lib/ai/prompt-builder"
import { 
  VISUAL_VOCABULARY, 
  TERRAIN_GUIDE, 
  LAYOUT_GENERATION_RULES,
  TAG_LIBRARY,
  FX_LIBRARY,
  REGION_CHANGE_EXAMPLES,
  SCENARIO_EXAMPLE_JSON,
  TURN_EXAMPLE_JSON
} from "@/lib/ai/knowledge-base"

interface DebugPanelProps {
  scenario: WarRoomScenario
  selectedTactic: CatalystOption | null
  onClose: () => void
}

type Tab = 'telemetry' | 'config' | 'prompt' | 'data'

export function DebugPanel({ scenario, selectedTactic, onClose }: DebugPanelProps) {
  const [openaiModels, setOpenaiModels] = useState<string[]>([]);
  const [googleModels, setGoogleModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const { 
    // Legacy / General accessors
    isLoading, 
    provider, setConfig, openaiKey, googleKey, selectedModel, 
    scenarioSystemPrompt, turnSystemPrompt,
    validateKey, isKeyValid, validationMessage, isMockMode, toggleMockMode, hasValidKey,
    history, clearHistory
  } = useAIStore()
  
  const [activeTab, setActiveTab] = useState<Tab>('config')
  const [promptEngineTab, setPromptEngineTab] = useState<'scenario' | 'turn'>('scenario')
  const [knowledgeTab, setKnowledgeTab] = useState('visual')
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Get current round from store
  const currentRound = useTargetingStore(s => s.currentRound)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    aiTelemetry: true,
    scenario: false,
    units: false,
    regions: false,
    selectedAction: false,
    allActions: false,
  })

  // Derived: last scenario prompts for execution log
  const lastScenarioTx = history.find(h => h.type === 'SCENARIO_GEN');
  const lastScenarioPrompt = lastScenarioTx?.userPrompt || null;
  const lastScenarioSystemPrompt = lastScenarioTx?.systemPrompt || null;

  // Derived: last turn prompts for execution log (fix ReferenceError)
  const lastTurnTx = history.find(h => h.type === 'TURN_RES');
  const lastTurnPrompt = lastTurnTx?.userPrompt || null;
  const lastTurnSystemPrompt = lastTurnTx?.systemPrompt || null;

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          setOpenaiModels(data.openai || []);
          setGoogleModels(data.google || []);
          } else {
          // Fallback to a curated list of recent/popular OpenAI models if API fails
          setOpenaiModels([
            'gpt-5.2',
            'gpt-5.2-pro',
            'gpt-5.2-codex',
            'gpt-5-mini',
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4.1',
            'gpt-3.5-turbo'
          ]);
          setGoogleModels(['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']);
        }
        } catch (error) {
        console.error('Failed to fetch models:', error);
        // Fallback to a curated list of recent/popular OpenAI models
        setOpenaiModels([
          'gpt-5.2',
          'gpt-5.2-pro',
          'gpt-5.2-codex',
          'gpt-5-mini',
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-4.1',
          'gpt-3.5-turbo'
        ]);
        setGoogleModels(['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Ensure selectedModel is compatible with provider when models are loaded.
  useEffect(() => {
    if (modelsLoading) return;
    const modelsList = provider === 'openai' ? openaiModels : googleModels;
    if (!modelsList || modelsList.length === 0) return;

    // If currently selected model is not available in the chosen provider's list, auto-select the first available.
    if (!selectedModel || !modelsList.includes(selectedModel)) {
      console.warn(`[debug-panel] Selected model '${selectedModel}' not found for provider '${provider}', auto-switching to '${modelsList[0]}'`);
      setConfig({ selectedModel: modelsList[0] });
    }
  }, [provider, modelsLoading, openaiModels, googleModels, selectedModel, setConfig]);

  // Dragging state
  const [position, setPosition] = useState({ x: 20, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (isMobile || !panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
  }

  // Handle drag move
  useEffect(() => {
    if (!isDragging || isMobile) return
    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 450)
      const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 600)
      setPosition({ x: Math.max(0, Math.min(newX, maxX)), y: Math.max(0, Math.min(newY, maxY)) })
    }
    const handleMouseUp = () => setIsDragging(false)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, isMobile])

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.95, y: isMobile ? 100 : 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: isMobile ? 100 : 0 }}
      className={`fixed z-[100] flex flex-col bg-[#03040a]/95 backdrop-blur-md shadow-2xl border border-cyan-900 overflow-hidden font-mono text-cyan-200
        ${isMobile 
          ? "inset-x-0 bottom-0 top-[15%] w-full rounded-t-xl" 
          : "w-[460px] max-h-[80vh] rounded-lg"
        }
      `}
      style={isMobile ? {} : {
        left: `${position.x}px`,
        top: `${position.y}px`,
        boxShadow: "0 0 40px rgba(8, 145, 178, 0.15)"
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between border-b border-cyan-900/50 bg-gradient-to-r from-[#041018] to-[#021018]"
        onMouseDown={!isMobile ? handleDragStart : undefined}
        style={{ cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab') }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-cyan-500/50" />
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm tracking-widest text-cyan-100 uppercase">System Console</h3>
            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold flex items-center gap-1 ${isMockMode ? 'bg-amber-900/30 text-amber-500' : 'bg-emerald-900/30 text-emerald-500'}`}>
              {isMockMode ? (
                'Mock Mode'
              ) : (
                <>
                  <span>{provider}</span>
                  <span className="opacity-50">/</span>
                  <span className="truncate max-w-[80px]">{selectedModel}</span>
                </>
              )}
            </span>
          </div>
          <span className="text-[10px] bg-cyan-900/40 px-1.5 py-0.5 rounded text-cyan-400 whitespace-normal break-words max-w-full" title={scenario.name}>
            {scenario.name.split(":")[0]}
          </span>
        </div>
        <button onClick={onClose} className="hover:bg-cyan-900/30 p-1.5 rounded-full transition-colors text-cyan-400 hover:text-cyan-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-cyan-900/50AI  bg-[#020810]">
        {/* MOVED CONFIG TO FIRST */}
        <TabButton id="config" icon={Settings} label="Config" active={activeTab} onClick={setActiveTab} />
        <TabButton id="telemetry" icon={Terminal} label="Telemetry" active={activeTab} onClick={setActiveTab} />
        <TabButton id="prompt" icon={MessageSquare} label="Prompt" active={activeTab} onClick={setActiveTab} />
        <TabButton id="data" icon={Database} label="Data" active={activeTab} onClick={setActiveTab} />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#02050a] min-h-[300px]">
        
        {/* TELEMETRY TAB */}
        {activeTab === 'telemetry' && (
          <div className="p-4 space-y-4">
             {/* System Status & Toggle */}
             <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-[#021718] border border-cyan-900/50">
               <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-pink-500 animate-pulse' : 'bg-emerald-500'}`} />
                 <span className="text-xs text-cyan-300 font-medium">{isLoading ? 'PROCESSING REQUEST...' : 'SYSTEM IDLE'}</span>
               </div>
               
               {/* Telemetry Toggle */}
               <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/20 border border-cyan-900/30">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-cyan-300 leading-none">
                      {isMockMode ? "MOCK DATA" : "AI"}
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleMockMode()}
                    className={`w-7 h-3.5 rounded-full p-0.5 transition-colors relative ${
                      !isMockMode 
                        ? (hasValidKey() ? 'bg-emerald-600' : 'bg-red-500') 
                        : 'bg-amber-500'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-transform ${!isMockMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
                  </button>
               </div>
             </div>

             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <h4 className="font-semibold text-[10px] text-cyan-500 uppercase tracking-wider">Transaction History</h4>
                 <span className="text-[10px] text-cyan-700">{history.length} events</span>
               </div>

               {/* Transaction List */}
               <div className="space-y-2 min-h-[400px]">
                 {history.length === 0 && (
                   <div className="text-center py-8 text-cyan-800 text-xs italic">
                     No AI transactions recorded yet.
                   </div>
                 )}

                 {history.map((tx) => (
                   <div key={tx.id} className="rounded border border-cyan-900/30 bg-[#050a10] overflow-hidden">
                     
                     {/* Header Row */}
                     <button 
                       onClick={() => setExpandedTxId(expandedTxId === tx.id ? null : tx.id)}
                       className={`w-full flex items-center justify-between p-2 text-xs hover:bg-cyan-900/10 transition-colors ${expandedTxId === tx.id ? 'bg-cyan-900/20' : ''}`}
                     >
                       <div className="flex items-center gap-2">
                         {tx.status === 'success' ? (
                           <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                         ) : tx.status === 'error' ? (
                           <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                         ) : (
                           <Clock className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                         )}
                         <span className={`font-bold ${tx.status === 'error' ? 'text-red-400' : 'text-cyan-200'}`}>
                           {tx.type}
                         </span>
                       </div>
                       <div className="flex items-center gap-3 text-[10px] text-cyan-600 font-mono">
                         {tx.latency && <span>{tx.latency}ms</span>}
                         <span>{new Date(tx.timestamp).toLocaleTimeString([], { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' })}</span>
                       </div>
                     </button>

                     {/* Expanded Details */}
                     <AnimatePresence>
                       {expandedTxId === tx.id && (
                         <motion.div 
                           initial={{ height: 0 }} 
                           animate={{ height: 'auto' }} 
                           exit={{ height: 0 }} 
                           className="overflow-hidden border-t border-cyan-900/30"
                         >
                           <div className="p-3 space-y-3 bg-[#02050a]">
                             
                             {/* 0. Token Stats Header */}
                             {tx.tokenUsage && (
                                <div className="flex gap-4 text-[10px] font-mono text-cyan-500 mb-0 p-2 bg-cyan-950/30 rounded border border-cyan-900/50">
                                  <span>In: <span className="text-cyan-200">{typeof tx.tokenUsage.promptTokens === 'number' ? tx.tokenUsage.promptTokens : '—'}</span> <span className="text-cyan-400">tokens</span></span>
                                  <span>Out: <span className="text-cyan-200">{typeof tx.tokenUsage.completionTokens === 'number' ? tx.tokenUsage.completionTokens : '—'}</span> <span className="text-cyan-400">tokens</span></span>
                                  <span className="font-bold ml-auto">Total: <span className="text-cyan-100">{tx.tokenUsage.totalTokens ?? ( (tx.tokenUsage.promptTokens ?? 0) + (tx.tokenUsage.completionTokens ?? 0) )}</span> <span className="text-cyan-400">tokens</span></span>
                                </div>
                             )}

                             {/* 1. Chain of Thought (Raw Output) */}
                             {tx.rawOutput && (
                               <div className="space-y-1">
                                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase">
                                   <BrainCircuit className="w-3 h-3" /> Raw AI Output
                                 </div>
                                 <div className="max-h-80 overflow-y-auto p-3 rounded bg-[#02050a] border border-amber-900/20 text-[11px] font-mono whitespace-pre-wrap text-amber-100/80">
                                   {tx.rawOutput}
                                 </div>
                               </div>
                             )}

                             {/* 2. Error Message (if failed) */}
                             {tx.error && (
                               <div className="p-2 rounded bg-red-900/20 border border-red-900/50 text-red-300 text-xs font-mono break-all">
                                 ERROR: {tx.error}
                               </div>
                             )}

                             {/* 3. Payload / Result */}
                             {tx.rawResponse !== undefined && tx.rawResponse !== null && (
                               <div className="space-y-1">
                                 <div className="flex justify-between items-center">
                                    <div className={`text-[10px] font-bold uppercase ${tx.status === 'error' ? 'text-red-400' : 'text-cyan-600'}`}>
                                      {tx.status === 'error' ? 'Raw Invalid Output' : 'Extracted JSON'}
                                    </div>
                                 </div>
                                 <div className={`max-h-60 overflow-y-auto rounded p-2 text-[10px] font-mono ${
                                    tx.status === 'error' ? 'bg-red-900/10 border border-red-900/30 text-red-200/80' : 'bg-black/40 border border-cyan-900/30 text-cyan-100/70'
                                 }`}>
                                   <pre className="whitespace-pre-wrap">
                                     {typeof tx.rawResponse === 'string' 
                                        ? (tx.rawResponse === "" ? "(server returned empty response)" : tx.rawResponse)
                                        : JSON.stringify(tx.rawResponse, null, 2)}
                                   </pre>
                                 </div>
                               </div>
                             )}

                             {/* 4. Inputs (Prompt) */}
                             <div className="space-y-1 pt-2 border-t border-cyan-900/30">
                                <div className="text-[10px] font-bold text-cyan-700 uppercase">Input Context</div>
                                <div className="grid grid-cols-1 gap-1">
                                   <TelemetryPrompt tx={tx} />
                                   {/* If you added userPrompt to AITransaction in step 2: */}
                                   {/* <DetailsAccordion title="User Prompt" content={tx.userPrompt || "N/A"} /> */}
                                </div>
                             </div>

                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

        {/* CONFIG TAB */}
        {activeTab === 'config' && (
          <div className="p-4 space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-cyan-100 uppercase border-b border-cyan-900/50 pb-2">AI Provider Settings</h4>
              
              <div className="space-y-1">
                <label className="text-[11px] text-cyan-400">Active Provider</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setConfig({ provider: 'openai' })}
                    className={`flex-1 py-1.5 px-3 rounded text-xs border ${provider === 'openai' ? 'bg-cyan-900/40 border-cyan-400 text-cyan-100' : 'bg-[#050a10] border-cyan-900/50 text-cyan-500 hover:border-cyan-700'}`}
                  >
                    OpenAI
                  </button>
                  <button 
                    onClick={() => setConfig({ provider: 'google' })}
                    className={`flex-1 py-1.5 px-3 rounded text-xs border ${provider === 'google' ? 'bg-cyan-900/40 border-cyan-400 text-cyan-100' : 'bg-[#050a10] border-cyan-900/50 text-cyan-500 hover:border-cyan-700'}`}
                  >
                    Google Gemini
                  </button>
                </div>
                <label className="text-[11px] text-cyan-400 flex items-center justify-between">
                   <span>{provider === 'openai' ? "OpenAI API Key" : "Google API Key"}</span>
                   {isKeyValid && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Active</span>}
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="password"
                    value={provider === 'openai' ? openaiKey : googleKey}
                    onChange={(e) => setConfig({ [provider === 'openai' ? 'openaiKey' : 'googleKey']: e.target.value })}
                    placeholder={provider === 'openai' ? "sk-..." : "AIza..."}
                    className="flex-1 bg-[#050a10] border border-cyan-900/50 rounded px-3 py-1.5 text-xs text-cyan-100 focus:border-cyan-400 focus:outline-none placeholder:text-cyan-900"
                  />
                  <button
                    onClick={() => validateKey()}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-400 text-xs rounded border border-cyan-900/50 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Verify"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[10px] text-cyan-500">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          validateKey(); // Skip verification but still pass model (argument removed)
                        }
                      }}
                      className="w-3 h-3 accent-cyan-500"
                    />
                    Skip verification (for quota issues)
                  </label>
                </div>
                {validationMessage && (
                    <div className={`mt-1 text-[10px] flex items-center gap-1 ${isKeyValid ? 'text-emerald-500' : 'text-pink-500'}`}>
                        {isKeyValid ? <CheckCircle2 className="w-3 h-3"/> : <AlertTriangle className="w-3 h-3"/>}
                        {validationMessage}
                    </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-cyan-400">Model ID</label>
                <div className="relative">
                  <select 
                    value={selectedModel}
                    onChange={(e) => setConfig({ selectedModel: e.target.value })}
                    disabled={modelsLoading}
                    className="w-full bg-[#050a10] border border-cyan-900/50 rounded px-3 py-1.5 text-xs text-cyan-100 focus:border-cyan-400 focus:outline-none appearance-none disabled:opacity-50"
                  >
                    <option value="" disabled>
                      {modelsLoading ? 'Loading models...' : 'Select a model...'}
                    </option>
                    {(provider === 'openai' ? openaiModels : googleModels).map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1.5 w-3 h-3 text-cyan-700 pointer-events-none" />
                </div>
                {selectedModel === 'custom' && (
                  <input 
                    type="text"
                    placeholder="Enter custom model ID..."
                    className="mt-2 w-full bg-[#050a10] border border-cyan-900/50 rounded px-3 py-1.5 text-xs text-cyan-100 focus:border-cyan-400 focus:outline-none"
                    onChange={(e) => setConfig({ selectedModel: e.target.value })}
                  />
                )}
              </div>
            </div>

            <div className="p-3 bg-yellow-900/10 border border-yellow-900/30 rounded text-[11px] text-yellow-600">
              Keys are stored in session memory only. We do not persist keys to disk for security.
            </div>
          </div>
        )}

        {/* PROMPT ENGINEERING TAB */}
        {activeTab === 'prompt' && (
            <div className="flex flex-col h-full bg-[#02050a]">
                 {/* 1. Sub-Navigation */}
                 <div className="flex border-b border-cyan-900/50 bg-[#020810] flex-shrink-0">
                    <button
                        onClick={() => setPromptEngineTab('scenario')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${promptEngineTab === 'scenario' ? 'text-amber-400 bg-amber-950/20 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Scenario Generator
                    </button>
                    <button
                        onClick={() => setPromptEngineTab('turn')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${promptEngineTab === 'turn' ? 'text-cyan-400 bg-cyan-950/20 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Turn Referee
                    </button>
                 </div>

                 {/* 2. Scrollable Content Area */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                    {/* A. SYSTEM INSTRUCTIONS (Editable) */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                                <Terminal className="w-3 h-3 text-purple-400" />
                                1. Core Instructions (Editable)
                            </h4>
                        </div>
                        <p className="text-[10px] text-slate-400">
                            The base persona and logical constraints.
                        </p>
                        <textarea
                            className="w-full h-32 bg-[#080808] border border-cyan-900/30 rounded p-3 text-[11px] font-mono text-purple-200 focus:outline-none focus:border-cyan-500 resize-y leading-relaxed"
                            value={promptEngineTab === 'scenario' ? scenarioSystemPrompt : turnSystemPrompt}
                            onChange={(e) => setConfig(promptEngineTab === 'scenario'
                                ? { scenarioSystemPrompt: e.target.value }
                                : { turnSystemPrompt: e.target.value }
                            )}
                            spellCheck={false}
                        />
                    </div>

                    {/* B. INJECTED KNOWLEDGE (ReadOnly - Restored!) */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                            <Database className="w-3 h-3 text-blue-400" />
                            2. Injected Knowledge Base
                        </h4>
                        <p className="text-[10px] text-slate-400">
                            Static rules and vocabulary appended to the system prompt on the server.
                        </p>

                        <div className="space-y-1">
                            {promptEngineTab === 'scenario' ? (
                              <>
                                <DetailsAccordion title="Layout Generation Rules" content={LAYOUT_GENERATION_RULES} />
                                <DetailsAccordion title="Terrain Guide" content={TERRAIN_GUIDE} />
                                <DetailsAccordion title="Visual Vocabulary (Actions)" content={VISUAL_VOCABULARY} />
                                <DetailsAccordion title="Tag Library" content={TAG_LIBRARY} />
                                <DetailsAccordion title="Scenario Example (Structure)" content={SCENARIO_EXAMPLE_JSON} />
                              </>
                            ) : (
                              <>
                                <DetailsAccordion title="Layout Generation Rules" content={LAYOUT_GENERATION_RULES} />
                                <DetailsAccordion title="Terrain Physics" content={TERRAIN_GUIDE} />
                                <DetailsAccordion title="Visual Vocabulary (Actions)" content={VISUAL_VOCABULARY} />
                                <DetailsAccordion title="Tag Library (Status)" content={TAG_LIBRARY} />
                                <DetailsAccordion title="FX Library (Visuals)" content={FX_LIBRARY} />
                                <DetailsAccordion title="Region Change Guide" content={REGION_CHANGE_EXAMPLES} />
                                <DetailsAccordion title="Turn Example (Structure)" content={TURN_EXAMPLE_JSON} />
                              </>
                            )}
                        </div>
                    </div>

                    {/* C. LIVE CONTEXT PREVIEW */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                            <MessageSquare className="w-3 h-3 text-cyan-400" />
                            3. Live Context (The Prompt)
                        </h4>
                        <p className="text-[10px] text-slate-400">
                            The exact game state data sent as the "User Message" for this specific moment.
                        </p>

                        <div className="bg-[#080808] border border-cyan-900/30 rounded p-3 max-h-64 overflow-y-auto custom-scrollbar">
                            <pre className="text-[10px] font-mono text-cyan-300 whitespace-pre-wrap leading-relaxed">
                                {promptEngineTab === 'scenario'
                                    ? `[User Input Placeholder]\n"Generate a scenario based on: <YOUR_TEXT_HERE>..."`
                                    : (selectedTactic
                                        ? buildTurnPrompt(scenario, selectedTactic, scenario.units.length > 0 ? 1 : 0).trim()
                                        : "// Select a Tactic Card on the map to generate the live turn context."
                                      )
                                }
                            </pre>
                        </div>
                    </div>

                    {/* D. OUTPUT SCHEMA */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                            <FileJson className="w-3 h-3 text-yellow-500" />
                            4. Expected Output Schema
                        </h4>
                        <div className="bg-[#080808] border border-cyan-900/30 rounded p-3 overflow-hidden">
                           {promptEngineTab === 'scenario' ? (
                             <ZodSchemaViewer schema={ScenarioGenerationSchema} />
                           ) : (
                             <ZodSchemaViewer schema={TurnResolutionSchema} />
                           )}
                        </div>
                    </div>

                 </div>
            </div>
        )}

        {/* DATA TAB */}
        {activeTab === 'data' && (
          <div className="flex flex-col h-full">

            {/* NEW: Raw JSON Viewer Section with Tabs */}
            <div className="p-4 border-b border-cyan-900/50 bg-[#020810] flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-cyan-100 uppercase flex items-center gap-2">
                  <FileJson className="w-3.5 h-3.5 text-amber-500" />
                  Snapshot Data <span className="text-cyan-700">|</span> Round {currentRound}
                </h4>
              </div>
              
              {/* Tabs for Raw vs Processed */}
              <SnapshotDataTabs scenario={scenario} />
            </div>

            {/* Existing Formatted View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <DebugPanelContent
                scenario={scenario}
                selectedTactic={selectedTactic}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
              />
            </div>
          </div>
        )}

      </div>
    </motion.div>
  )
}

function DetailsAccordion({ title, content }: { title: string, content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-cyan-900/40 rounded bg-[#02050a] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-[10px] uppercase font-bold text-cyan-500 hover:bg-cyan-900/10 transition-colors"
      >
        <span>{title}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-3 py-2 border-t border-cyan-900/40 text-[10px] text-cyan-300 font-mono whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      )}
    </div>
  )
}

function TelemetryPrompt({ tx }: { tx: any }) {
  const { isMockMode } = useAIStore();
  const [copied, setCopied] = useState(false);

  const isMockTx = Boolean(tx.rawResponse && String(tx.rawResponse._note || '').toUpperCase().includes('MOCK')) || (tx.type === 'TURN_RES' && isMockMode);

  const promptContent = isMockTx ? "Mock data — no system prompt (no AI call was made)" : (tx.systemPrompt || "N/A");

  const handleCopy = async () => {
    try {
      const text = tx.systemPrompt || (typeof tx.rawResponse === 'string' ? tx.rawResponse : JSON.stringify(tx.rawResponse || tx.rawOutput || {}, null, 2));
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error('Copy failed', e);
    }
  }

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <DetailsAccordion title="System Prompt" content={promptContent} />
      </div>
      <div className="pt-1">
        <button
          title="Copy prompt"
          onClick={handleCopy}
          className={`p-2 rounded-md bg-[#021719] border border-cyan-900/30 hover:bg-[#032425] transition-colors text-cyan-200`}
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function TabButton({ id, icon: Icon, label, active, onClick }: { id: Tab, icon: any, label: string, active: Tab, onClick: (t: Tab) => void }) {
  const isActive = active === id
  return (
    <button 
      onClick={() => onClick(id)}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2 ${
        isActive 
          ? 'border-cyan-400 text-cyan-100 bg-[#05101a]' 
          : 'border-transparent text-cyan-600 hover:text-cyan-400 hover:bg-[#05101a]/50'
      }`}
    >
      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : ''}`} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function DebugPanelContent({ scenario, selectedTactic, expandedSections, toggleSection }: { scenario: WarRoomScenario; selectedTactic: CatalystOption | null; expandedSections: Record<string, boolean>; toggleSection: (s: string) => void }) {
  return (<>
        <DebugSection 
          title="Scenario Info" 
          expanded={expandedSections.scenario} 
          onToggle={() => toggleSection('scenario')}
        >
          <div className="space-y-2 text-xs font-mono">
            <InfoRow label="ID" value={scenario.id} />
            <InfoRow label="Name" value={scenario.name} />
            <InfoRow label="Era" value={scenario.era} />
            <InfoRow label="Player" value={scenario.playerPolity} />
            <InfoRow label="Enemy" value={scenario.enemyPolity} />
            <InfoRow label="Map Size" value={`${scenario.mapDimensions.width}×${scenario.mapDimensions.height}`} />
            <InfoRow label="Hex Grid" value={scenario.hexGrid ? `${scenario.hexGrid.length} hexes` : "Not generated"} />
            <InfoRow label="Regions" value={scenario.mapRegions.length.toString()} />
            <InfoRow label="Units" value={scenario.units.length.toString()} />
            <InfoRow label="Options" value={scenario.options.length.toString()} />
          </div>
        </DebugSection>

        {/* Selected Action Details */}
        {selectedTactic && (
          <DebugSection 
            title="Selected Action" 
            expanded={expandedSections.selectedAction} 
            onToggle={() => toggleSection('selectedAction')}
            highlight
          >
            <div className="space-y-3">
              <div className="p-2 rounded border border-cyan-900 bg-[#041018]">
                <div className="font-bold text-cyan-200 text-sm mb-1">{selectedTactic.title}</div>
                <div className="text-xs text-cyan-300">{selectedTactic.description}</div>
              </div>
              
              <div className="space-y-2 text-sm font-mono text-cyan-200">
                <InfoRow label="ID" value={selectedTactic.id} />
                {selectedTactic.semanticAction && (
                  <InfoRow label="Action Type" value={selectedTactic.semanticAction} />
                )}
                {selectedTactic.targetRegionId && (
                  <InfoRow label="Target Region" value={selectedTactic.targetRegionId} />
                )}
                {Array.isArray(selectedTactic.requiredUnitTypes) && selectedTactic.requiredUnitTypes.length > 0 && (
                  <InfoRow label="Required Units" value={selectedTactic.requiredUnitTypes.join(", ")} />
                )}
              </div>

              {selectedTactic.compositeActions && selectedTactic.compositeActions.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-semibold text-cyan-200 mb-2">Composite Actions ({selectedTactic.compositeActions.length})</div>
                  <div className="space-y-2">
                    {selectedTactic.compositeActions.map((action, idx) => (
                      <div key={idx} className="p-2 rounded border border-cyan-900 bg-[#021719] text-sm">
                        <div className="font-bold text-cyan-200 mb-1">
                          {idx + 1}. {action.semanticAction}
                        </div>
                        {action.description && (
                          <div className="text-cyan-300 mb-1 italic">{action.description}</div>
                        )}
                        <div className="space-y-1 font-mono text-[11px] text-cyan-300">
                          {action.targetLogic && <InfoRow label="Target" value={action.targetLogic} compact />}
                          {action.targetRegionId && <InfoRow label="Region" value={action.targetRegionId} compact />}
                          {Array.isArray(action.requiredUnitTypes) && action.requiredUnitTypes.length > 0 && (
                            <InfoRow label="Units" value={action.requiredUnitTypes.join(", ")} compact />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTactic.visualEffects && selectedTactic.visualEffects.length > 0 && (
                <div className="mt-3">
                  <InfoRow label="Visual FX" value={selectedTactic.visualEffects.join(", ")} />
                </div>
              )}
            </div>
          </DebugSection>
        )}

        {/* Units */}
        <DebugSection 
          title="Units" 
          expanded={expandedSections.units} 
          onToggle={() => toggleSection('units')}
        >
          <div className="space-y-2">
            {scenario.units.map(unit => (
              <div key={unit.id} className={`p-2 rounded border text-sm bg-[#041018] border-cyan-900 text-cyan-200`}>
                <div className="font-bold mb-1">{unit.name}</div>
                <div className="space-y-1 font-mono text-[11px] text-cyan-300">
                  <InfoRow label="ID" value={unit.id} compact />
                  <InfoRow label="Type" value={unit.type} compact />
                  <InfoRow label="Owner" value={unit.owner} compact />
                  <InfoRow label="Status" value={unit.status || "fresh"} compact />
                  {unit.hex && (
                    <InfoRow label="Hex" value={`(${unit.hex.q}, ${unit.hex.r})`} compact />
                  )}
                  {unit.placement && (
                    <>
                      <InfoRow label="Region" value={unit.placement.regionId} compact />
                      <InfoRow label="Tag" value={unit.placement.tag} compact />
                    </>
                  )}
                  {unit.tags && unit.tags.length > 0 && (
                    <InfoRow label="Tags" value={unit.tags.join(", ")} compact />
                  )}
                </div>
              </div>
            ))}
          </div>
        </DebugSection>

        {/* Regions */}
        <DebugSection 
          title="Map Regions" 
          expanded={expandedSections.regions} 
          onToggle={() => toggleSection('regions')}
        >
          <div className="space-y-2">
            {/* Scenario-level decorations (rivers, labels, roads) */}
            {scenario.decorations && scenario.decorations.length > 0 && (
              <div className="p-2 rounded bg-[#011718] border border-cyan-900 text-sm text-cyan-300 mb-2">
                <div className="font-semibold text-cyan-200 mb-1">Decorations ({scenario.decorations.length})</div>
                <div className="space-y-1 font-mono text-[11px]">
                  {scenario.decorations.map(dec => (
                    <div key={dec.id} className="flex items-center justify-between">
                      <div className="text-cyan-200">{dec.id} • <span className="text-cyan-300">{dec.type}</span></div>
                      <div className="text-cyan-300 text-[11px]">{dec.label || `${dec.points?.length ?? 0} pts`}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {scenario.mapRegions.map(region => {
              const layoutDef = scenario.layoutDefs?.find(d => d.id === region.id);
              return (
                <div key={region.id} className="p-2 rounded bg-[#041018] border border-cyan-900 text-sm text-cyan-200">
                  <div className="font-bold text-cyan-200 mb-1">{region.name}</div>
                  <div className="space-y-1 font-mono text-[11px] text-cyan-300">
                    <InfoRow label="ID" value={region.id} compact />
                    <InfoRow label="Terrain" value={region.terrain || "plains"} compact />
                    {/* Show region type from layoutDefs when available */}
                    {layoutDef?.type && <InfoRow label="Type" value={String(layoutDef.type)} compact />}
                    {region.isFort && <InfoRow label="Fort" value="Yes" compact />}
                    {region.features && region.features.length > 0 && (
                      <InfoRow label="Features" value={region.features.map(f => f.type).join(", ")} compact />
                    )}
                    {region.gridScale && <InfoRow label="Grid" value={String(region.gridScale)} compact />}
                    {region.isCity && <InfoRow label="City" value="Yes" compact />}
                    {layoutDef?.points && layoutDef.points.length > 0 ? (
                      <InfoRow label="Seed Points" value={JSON.stringify(layoutDef.points)} compact />
                    ) : region.points && region.points.length > 0 ? (
                      <InfoRow label="Points" value={`${region.points.length} vertices`} compact />
                    ) : null}
                    {region.centroid && (
                      <InfoRow label="Centroid" value={`(${Math.round(region.centroid.x)}, ${Math.round(region.centroid.y)})`} compact />
                    )}
                    {/* Rivers that reference this region by ID */}
                    {scenario.rivers && scenario.rivers.length > 0 && (
                      (() => {
                        const hit = scenario.rivers!.filter(r => r.pathNodes.includes(region.id));
                        return hit.length > 0 ? <InfoRow label="Rivers" value={hit.map(h => h.name).join(", ")} compact /> : null;
                      })()
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </DebugSection>
        {/* All Actions */}
        <DebugSection 
          title="All Tactical Options" 
          expanded={expandedSections.allActions} 
          onToggle={() => toggleSection('allActions')}
        >
          <div className="space-y-3">
            {scenario.options.map(option => (
              <div key={option.id} className="p-3 rounded bg-[#021719] border border-cyan-900 text-sm text-cyan-200">
                <div className="font-bold text-cyan-200 mb-1">{option.title}</div>
                {option.description && (
                  <div className="text-[12px] text-cyan-300 mb-2">{option.description}</div>
                )}
                <div className="space-y-1 font-mono text-[11px] mb-2 text-cyan-300">
                  <InfoRow label="ID" value={option.id} compact />
                  {option.semanticAction && <InfoRow label="Action" value={option.semanticAction} compact />}
                  {option.targetRegionId && <InfoRow label="Region" value={option.targetRegionId} compact />}
                  {Array.isArray(option.requiredUnitTypes) && option.requiredUnitTypes.length > 0 && (
                    <InfoRow label="Required Units" value={option.requiredUnitTypes.join(", ")} compact />
                  )}
                  {option.visualEffects && option.visualEffects.length > 0 && (
                    <InfoRow label="Visual FX" value={option.visualEffects.join(", ")} compact />
                  )}
                </div>
                
                {option.compositeActions && option.compositeActions.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-semibold text-cyan-200 mb-1">Composite Actions ({option.compositeActions.length})</div>
                    <div className="space-y-1">
                      {option.compositeActions.map((action, idx) => (
                        <div key={idx} className="pl-2 border-l-2 border-cyan-900 bg-[#011719] rounded-sm p-1 text-cyan-300">
                          <div className="font-mono text-[11px] space-y-0.5">
                            <div className="text-cyan-200 font-semibold">{action.semanticAction}</div>
                            {action.targetLogic && <div>Logic: {action.targetLogic}</div>}
                            {action.targetRegionId && <div>Region: {action.targetRegionId}</div>}
                            {Array.isArray(action.requiredUnitTypes) && action.requiredUnitTypes.length > 0 && (
                              <div>Units: {action.requiredUnitTypes.join(", ")}</div>
                            )}
                            {action.description && <div className="text-cyan-300 italic">"{action.description}"</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DebugSection>
      </>
    )
  }

function DebugSection({ 
  title, 
  expanded, 
  onToggle, 
  children,
  highlight = false 
}: { 
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className={`border-b ${highlight ? 'border-cyan-700' : 'border-[#071018]'}`}>
      <button
        onClick={onToggle}
        className={`w-full px-4 py-2 flex items-center justify-between hover:bg-[#021719] transition-colors ${
          highlight ? 'bg-[#021719]' : ''
        }`}
      >
        <span className={`font-semibold text-sm ${highlight ? 'text-cyan-200' : 'text-cyan-300'}`}>
          {title}
        </span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-cyan-300" />
        ) : (
          <ChevronRight className="w-4 h-4 text-cyan-300" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-[#021719]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ZodSchemaViewer({ schema }: { schema: unknown }) {
  // Define a type for Zod-like schema objects
  type ZodLike = {
    _def?: { 
      typeName?: string; 
      type?: unknown; 
      innerType?: unknown; 
      options?: unknown[];
      values?: string[];
    }; 
    shape?: Record<string, unknown>;
    element?: unknown;
    unwrap?: () => unknown;
  };
  
  // Recursively print keys to simulate JSON structure
  const renderSchema = (s: unknown, depth = 0): React.ReactNode => {
    const zodSchema = s as ZodLike | null;
    if (!zodSchema || !zodSchema._def) return <span className="text-slate-500">unknown</span>;

    // Handle ZodObject
    if (zodSchema._def.typeName === 'ZodObject') {
      const shape = zodSchema.shape || {};
      return (
        <div className="ml-2">
          <span className="text-slate-500">{'{'}</span>
          {Object.entries(shape).map(([key, value]) => (
            <div key={key} style={{ paddingLeft: `${(depth + 1) * 10}px` }}>
              <span className="text-cyan-200">{key}</span>
              <span className="text-slate-500">: </span>
              {renderSchema(value, depth + 1)}
            </div>
          ))}
          <span className="text-slate-500" style={{ paddingLeft: `${depth * 10}px` }}>{'}'}</span>
        </div>
      );
    }

    // Handle ZodArray
    if (zodSchema._def.typeName === 'ZodArray') {
      return (
        <span>
          <span className="text-yellow-500">Array</span>
          <span className="text-slate-500">&lt;</span>
          {renderSchema(zodSchema.element, depth)}
          <span className="text-slate-500">&gt;</span>
        </span>
      );
    }

    // Handle Primitives & Enums
    if (zodSchema._def.typeName === 'ZodEnum') return <span className="text-green-400">Enum({zodSchema._def.values?.join('|')})</span>;
    if (zodSchema._def.typeName === 'ZodString') return <span className="text-orange-400">String</span>;
    if (zodSchema._def.typeName === 'ZodNumber') return <span className="text-blue-400">Number</span>;
    if (zodSchema._def.typeName === 'ZodOptional' && zodSchema.unwrap) return <span>{renderSchema(zodSchema.unwrap(), depth)} <span className="text-slate-600 italic">(opt)</span></span>;

    return <span className="text-slate-500">{zodSchema._def.typeName}</span>;
  };

  return (
    <div className="font-mono text-[10px] leading-relaxed">
      {renderSchema(schema)}
    </div>
  );
}

function InfoRow({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`flex ${compact ? 'gap-1' : 'gap-2'}`}>
      <span className="text-cyan-400 font-semibold min-w-[80px]">{label}:</span>
      <span className="text-cyan-200 break-all">{value}</span>
    </div>
  )
}

function SnapshotDataTabs({ scenario }: { scenario: WarRoomScenario }) {
  const [activeTab, setActiveTab] = useState<'raw' | 'processed'>('raw');
  const [copied, setCopied] = useState(false);

  // Raw scenario: Strip out the hydrated fields (hexGrid, hexIndex, mapRegions with exact points)
  const rawScenario = {
    ...scenario,
    hexGrid: undefined,
    hexIndex: undefined,
    mapRegions: scenario.layoutDefs ? undefined : scenario.mapRegions?.map(r => ({
      id: r.id,
      name: r.name,
      terrain: r.terrain,
      isFort: r.isFort,
      isCity: r.isCity,
      // Omit: points, neighbors, centroid, subPolygons (these are generated)
    }))
  };

  const currentData = activeTab === 'raw' ? rawScenario : scenario;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  return (
    <div className="space-y-2">
      {/* Tab Buttons */}
      <div className="flex gap-2 border-b border-cyan-900/30">
        <button
          onClick={() => setActiveTab('raw')}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'raw'
              ? 'border-amber-500 text-amber-400 bg-amber-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Raw (Source)
        </button>
        <button
          onClick={() => setActiveTab('processed')}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'processed'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Processed (Engine)
        </button>
        <button
          onClick={handleCopy}
          className="ml-auto p-1.5 hover:bg-cyan-900/30 rounded text-cyan-500 hover:text-cyan-200 transition-colors"
          title={`Copy ${activeTab === 'raw' ? 'Raw' : 'Processed'} JSON`}
        >
          {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      {/* JSON Display */}
      <div className="max-h-48 overflow-y-auto rounded border border-cyan-900/30 bg-[#050a10] p-3 shadow-inner custom-scrollbar">
        <pre className="text-[9px] font-mono text-cyan-300/70 whitespace-pre-wrap break-all">
          {JSON.stringify(currentData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
