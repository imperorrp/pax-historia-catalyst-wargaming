"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight, X, Terminal, GripVertical, Settings, Database, MessageSquare, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import type { WarRoomScenario, CatalystOption } from "@/lib/types"
import { useAIStore } from "@/lib/ai/store"
import { ScenarioGenerationSchema, TurnResolutionSchema } from "@/lib/ai/schemas"
import { 
  VISUAL_VOCABULARY, 
  TERRAIN_GUIDE, 
  LAYOUT_GENERATION_RULES,
  TAG_LIBRARY,
  FX_LIBRARY,
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
    lastScenarioPrompt, lastScenarioSystemPrompt, 
    lastTurnPrompt, lastTurnSystemPrompt,
    // Legacy / General accessors
    lastPrompt, lastResponse, isLoading, 
    provider, setConfig, openaiKey, googleKey, selectedModel, 
    scenarioSystemPrompt, turnSystemPrompt,
    validateKey, isKeyValid, isValidating, validationMessage, isMockMode, toggleMockMode, hasValidKey 
  } = useAIStore()
  
  const [activeTab, setActiveTab] = useState<Tab>('telemetry')
  const [promptEngineTab, setPromptEngineTab] = useState<'scenario' | 'turn'>('scenario')
  const [knowledgeTab, setKnowledgeTab] = useState('visual')

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    aiTelemetry: true,
    scenario: false,
    units: false,
    regions: false,
    selectedAction: false,
    allActions: false,
  })

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
          // Fallback to hardcoded models if API fails
          setOpenaiModels(['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini']);
          setGoogleModels(['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // Fallback to hardcoded models
        setOpenaiModels(['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini']);
        setGoogleModels(['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Dragging state
  const [position, setPosition] = useState({ x: 20, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (!panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
  }

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return
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
  }, [isDragging, dragOffset])

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed z-[100] w-[460px] max-h-[80vh] flex flex-col bg-[#03040a]/95 backdrop-blur-md shadow-2xl border border-cyan-900 rounded-lg overflow-hidden font-mono text-cyan-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        boxShadow: "0 0 40px rgba(8, 145, 178, 0.15)"
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between border-b border-cyan-900/50 bg-gradient-to-r from-[#041018] to-[#021018]"
        onMouseDown={handleDragStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-cyan-500/50" />
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm tracking-widest text-cyan-100 uppercase">System Console</h3>
          </div>
          <span className="text-[10px] bg-cyan-900/40 px-1.5 py-0.5 rounded text-cyan-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={scenario.name}>
            {scenario.name.split(":")[0]}
          </span>
        </div>
        <button onClick={onClose} className="hover:bg-cyan-900/30 p-1.5 rounded-full transition-colors text-cyan-400 hover:text-cyan-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-cyan-900/50AI  bg-[#020810]">
        <TabButton id="telemetry" icon={Terminal} label="Telemetry" active={activeTab} onClick={setActiveTab} />
        <TabButton id="config" icon={Settings} label="Config" active={activeTab} onClick={setActiveTab} />
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

             <div className="space-y-1">
               <h4 className="font-semibold text-[10px] text-cyan-500 uppercase tracking-wider">Latest Transmission</h4>
               <textarea 
                className="w-full h-32 bg-[#050a10] border border-cyan-900/50 p-3 rounded text-[11px] leading-relaxed text-cyan-100 placeholder:text-cyan-800 focus:outline-none focus:border-cyan-500 font-mono"
                value={lastPrompt}
                readOnly
                placeholder="No signals intercepted."
               />
             </div>

             <div className="space-y-1">
               <h4 className="font-semibold text-[10px] text-cyan-500 uppercase tracking-wider">Engine Response</h4>
               <div className="h-48 overflow-y-auto bg-[#050a10] border border-cyan-900/50 p-3 rounded text-[11px] text-cyan-100 font-mono">
                 <pre className="whitespace-pre-wrap">
                  {lastResponse && typeof lastResponse === 'object' && Object.keys(lastResponse).length > 0
                    ? JSON.stringify(lastResponse, null, 2)
                    : "// Waiting for input..."}
                 </pre>
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
                    onClick={() => validateKey(false, selectedModel)}
                    disabled={isValidating}
                    className="px-3 py-1.5 bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-400 text-xs rounded border border-cyan-900/50 transition-colors disabled:opacity-50"
                  >
                    {isValidating ? <Loader2 className="w-4 h-4 animate-spin"/> : "Verify"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[10px] text-cyan-500">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          validateKey(true, selectedModel); // Skip verification but still pass model
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
                 {/* Internal Tabs - Splitting Scenario vs Turn */}
                 <div className="flex border-b border-cyan-900/50 bg-[#020810]">
                    <button 
                        onClick={() => setPromptEngineTab('scenario')} 
                        className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${promptEngineTab === 'scenario' ? 'text-amber-100 bg-amber-900/20 border-b-2 border-amber-500' : 'text-cyan-600 hover:text-cyan-400'}`}
                    >
                        1. Scenario Generator
                    </button>
                    <button 
                        onClick={() => setPromptEngineTab('turn')} 
                        className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${promptEngineTab === 'turn' ? 'text-cyan-100 bg-[#06121f] border-b-2 border-cyan-400' : 'text-cyan-600 hover:text-cyan-400'}`}
                    >
                        2. Turn Referee
                    </button>
                 </div>

                 {/* Content */}
                 <div className="p-4 space-y-4 overflow-y-auto">
                    
                    {/* SCENARIO GENERATOR TAB */}
                    {promptEngineTab === 'scenario' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-amber-500 uppercase border-b border-amber-900/50 pb-1">AI Persona & User Instructions</h4>
                                <textarea 
                                    className="w-full h-24 bg-[#050a10] border border-amber-900/50 p-3 rounded text-[11px] leading-relaxed text-amber-100 placeholder:text-amber-800 focus:outline-none focus:border-amber-500 font-mono resize-y"
                                    value={scenarioSystemPrompt}
                                    onChange={(e) => setConfig({ scenarioSystemPrompt: e.target.value })}
                                    placeholder="Instructions for the Scenario Generator..."
                                />
                            </div>

                             {/* Knowledge Base (Relevant subset) */}
                             <div className="space-y-2">
                                <h4 className="text-xs font-bold text-amber-500/80 uppercase border-b border-amber-900/30 pb-1">Injected Knowledge</h4>
                                <div className="grid grid-cols-1 gap-1">
                                    <DetailsAccordion title="Layout Rules (Painter's Algo)" content={LAYOUT_GENERATION_RULES} />
                                    <DetailsAccordion title="Terrain Guide" content={TERRAIN_GUIDE} />
                                    <DetailsAccordion title="Visual Vocabulary" content={VISUAL_VOCABULARY} />
                                    <DetailsAccordion title="Few-Shot Example: Battle of Hastings" content={SCENARIO_EXAMPLE_JSON} />
                                </div>
                             </div>

                            {/* Execution Log */}
                            <div className="space-y-2 pt-4 border-t border-amber-900/30">
                                <h4 className="text-xs font-bold text-amber-400 uppercase flex justify-between">
                                    <span>Last Execution Log</span>
                                </h4>
                                
                                <div className="space-y-1">
                                    <div className="text-[10px] text-amber-600 font-bold">1. USER INPUT (The Prompt)</div>
                                    <div className="h-16 overflow-y-auto bg-[#02050a] border border-amber-900/30 p-2 rounded text-[10px] text-amber-200/80 font-mono whitespace-pre-wrap">
                                        {lastScenarioPrompt || "No scenario generated yet."}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-[10px] text-amber-600 font-bold">2. FULL CONTEXT SENT TO AI (System Prompt + Knowledge)</div>
                                    <div className="h-32 overflow-y-auto bg-[#02050a] border border-amber-900/30 p-2 rounded text-[10px] text-amber-100 font-mono whitespace-pre-wrap">
                                        {lastScenarioSystemPrompt || "No data."}
                                    </div>
                                </div>
                            </div>

                             {/* Schemas */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-amber-500/70 uppercase border-b border-amber-900/30 pb-1">Validation Schema</h4>
                                <div className="h-24 overflow-y-auto bg-[#050a10] border border-amber-900/50 p-2 rounded text-[10px] text-amber-400 font-mono">
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(ScenarioGenerationSchema, null, 2)}</pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TURN REFEREE TAB */}
                    {promptEngineTab === 'turn' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-cyan-400 uppercase border-b border-cyan-900/50 pb-1">AI Persona & User Instructions</h4>
                                <textarea 
                                    className="w-full h-24 bg-[#050a10] border border-cyan-900/50 p-3 rounded text-[11px] leading-relaxed text-cyan-100 placeholder:text-cyan-800 focus:outline-none focus:border-cyan-500 font-mono resize-y"
                                    value={turnSystemPrompt}
                                    onChange={(e) => setConfig({ turnSystemPrompt: e.target.value })}
                                    placeholder="Instructions for the Turn Referee..."
                                />
                            </div>

                             {/* Knowledge Base (Relevant subset) */}
                             <div className="space-y-2">
                                <h4 className="text-xs font-bold text-cyan-500/80 uppercase border-b border-cyan-900/30 pb-1">Injected Knowledge</h4>
                                <div className="grid grid-cols-1 gap-1">
                                    <DetailsAccordion title="Visual Vocabulary (Actions)" content={VISUAL_VOCABULARY} />
                                    <DetailsAccordion title="Tag Library (Status Effects)" content={TAG_LIBRARY} />
                                    <DetailsAccordion title="FX Library" content={FX_LIBRARY} />
                                    <DetailsAccordion title="Few-Shot Example: Turn Resolution" content={TURN_EXAMPLE_JSON} />
                                </div>
                             </div>

                            {/* Execution Log */}
                            <div className="space-y-2 pt-4 border-t border-cyan-900/30">
                                <h4 className="text-xs font-bold text-cyan-400 uppercase flex justify-between">
                                    <span>Last Execution Log</span>
                                </h4>
                                
                                <div className="space-y-1">
                                    <div className="text-[10px] text-cyan-600 font-bold">1. INPUT STATE (The Prompt)</div>
                                    <div className="h-24 overflow-y-auto bg-[#02050a] border border-cyan-900/30 p-2 rounded text-[10px] text-cyan-200/80 font-mono whitespace-pre-wrap">
                                        {lastTurnPrompt || "No turn resolved yet."}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-[10px] text-cyan-600 font-bold">2. FULL CONTEXT SENT TO AI (System Prompt + Knowledge)</div>
                                    <div className="h-32 overflow-y-auto bg-[#02050a] border border-cyan-900/30 p-2 rounded text-[10px] text-cyan-100 font-mono whitespace-pre-wrap">
                                        {lastTurnSystemPrompt || "No data."}
                                    </div>
                                </div>
                            </div>

                             {/* Schemas */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-cyan-500/70 uppercase border-b border-cyan-900/30 pb-1">Validation Schema</h4>
                                <div className="h-24 overflow-y-auto bg-[#050a10] border border-cyan-900/50 p-2 rounded text-[10px] text-cyan-400 font-mono">
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(TurnResolutionSchema, null, 2)}</pre>
                                </div>
                            </div>
                        </div>
                    )}
                 </div>
            </div>
        )}

        {/* DATA TAB (Original Debug Content) */}
        {activeTab === 'data' && (
          <div className="p-0">
             <DebugPanelContent 
                scenario={scenario}
                selectedTactic={selectedTactic}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
              />
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
                {selectedTactic.requiredUnitTypes && (
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
                          {action.requiredUnitTypes && (
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
                  {option.requiredUnitTypes && <InfoRow label="Required Units" value={option.requiredUnitTypes.join(", ")} compact />}
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
                            {action.requiredUnitTypes && <div>Units: {action.requiredUnitTypes.join(", ")}</div>}
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

function InfoRow({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`flex ${compact ? 'gap-1' : 'gap-2'}`}>
      <span className="text-cyan-400 font-semibold min-w-[80px]">{label}:</span>
      <span className="text-cyan-200 break-all">{value}</span>
    </div>
  )
}
