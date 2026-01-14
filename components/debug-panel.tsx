"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight, X } from "lucide-react"
import type { WarRoomScenario, CatalystOption } from "@/lib/types"

interface DebugPanelProps {
  scenario: WarRoomScenario
  selectedTactic: CatalystOption | null
  onClose: () => void
}

export function DebugPanel({ scenario, selectedTactic, onClose }: DebugPanelProps) {
  console.log('DebugPanel rendering with debugMode active')
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    scenario: true,
    units: false,
    regions: false,
    selectedAction: true,
    allActions: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-4 top-20 bottom-4 w-[420px] bg-white/95 backdrop-blur-lg shadow-2xl border-2 border-purple-200 rounded-lg overflow-hidden z-50"
    >
      {/* Header */}
      <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between border-b-2 border-purple-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <h3 className="font-bold font-mono text-sm">DEBUG MODE</h3>
        </div>
        <button onClick={onClose} className="hover:bg-purple-700 p-1 rounded transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto h-full pb-4">
        {/* Scenario Overview */}
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
              <div className="bg-purple-50 p-2 rounded border border-purple-200">
                <div className="font-bold text-purple-900 text-sm mb-1">{selectedTactic.title}</div>
                <div className="text-xs text-purple-700">{selectedTactic.description}</div>
              </div>
              
              <div className="space-y-2 text-xs font-mono">
                <InfoRow label="ID" value={selectedTactic.id} />
                <InfoRow label="Action Type" value={selectedTactic.semanticAction} />
                <InfoRow label="Target Logic" value={selectedTactic.targetLogic || "nearest"} />
                {selectedTactic.targetRegionId && (
                  <InfoRow label="Target Region" value={selectedTactic.targetRegionId} />
                )}
                {selectedTactic.requiredUnitTypes && (
                  <InfoRow label="Required Units" value={selectedTactic.requiredUnitTypes.join(", ")} />
                )}
              </div>

              {selectedTactic.compositeActions && selectedTactic.compositeActions.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-bold text-purple-900 mb-2">Composite Actions ({selectedTactic.compositeActions.length})</div>
                  <div className="space-y-2">
                    {selectedTactic.compositeActions.map((action, idx) => (
                      <div key={idx} className="bg-purple-50 p-2 rounded border border-purple-200 text-xs">
                        <div className="font-bold text-purple-800 mb-1">
                          {idx + 1}. {action.semanticAction}
                        </div>
                        {action.description && (
                          <div className="text-purple-600 mb-1 italic">{action.description}</div>
                        )}
                        <div className="space-y-1 font-mono text-[10px]">
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
              <div key={unit.id} className={`p-2 rounded border text-xs ${
                unit.owner === 'player' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="font-bold mb-1">{unit.name}</div>
                <div className="space-y-1 font-mono text-[10px]">
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
            {scenario.mapRegions.map(region => (
              <div key={region.id} className="p-2 rounded bg-amber-50 border border-amber-200 text-xs">
                <div className="font-bold text-amber-900 mb-1">{region.name}</div>
                <div className="space-y-1 font-mono text-[10px]">
                  <InfoRow label="ID" value={region.id} compact />
                  <InfoRow label="Terrain" value={region.terrain || "plains"} compact />
                  {region.isFort && <InfoRow label="Fort" value="Yes" compact />}
                  {region.isCity && <InfoRow label="City" value="Yes" compact />}
                  {region.points && (
                    <InfoRow label="Points" value={`${region.points.length} vertices`} compact />
                  )}
                  {region.centroid && (
                    <InfoRow label="Centroid" value={`(${Math.round(region.centroid.x)}, ${Math.round(region.centroid.y)})`} compact />
                  )}
                </div>
              </div>
            ))}
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
              <div key={option.id} className="p-3 rounded bg-slate-50 border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 mb-2">{option.title}</div>
                <div className="space-y-1 font-mono text-[10px] mb-2">
                  <InfoRow label="ID" value={option.id} compact />
                  <InfoRow label="Action" value={option.semanticAction} compact />
                  <InfoRow label="Target Logic" value={option.targetLogic || "nearest"} compact />
                  {option.targetRegionId && <InfoRow label="Region" value={option.targetRegionId} compact />}
                  {option.requiredUnitTypes && <InfoRow label="Required Units" value={option.requiredUnitTypes.join(", ")} compact />}
                </div>
                
                {option.compositeActions && option.compositeActions.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-bold text-purple-900 mb-1">Composite Actions ({option.compositeActions.length})</div>
                    <div className="space-y-1">
                      {option.compositeActions.map((action, idx) => (
                        <div key={idx} className="pl-2 border-l-2 border-purple-200 bg-purple-25 rounded-sm p-1">
                          <div className="font-mono text-[9px] space-y-0.5">
                            <div className="text-purple-800 font-semibold">{action.semanticAction}</div>
                            {action.targetLogic && <div>Logic: {action.targetLogic}</div>}
                            {action.targetRegionId && <div>Region: {action.targetRegionId}</div>}
                            {action.requiredUnitTypes && <div>Units: {action.requiredUnitTypes.join(", ")}</div>}
                            {action.description && <div className="text-slate-600 italic">"{action.description}"</div>}
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
      </div>
    </motion.div>
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
    <div className={`border-b ${highlight ? 'border-purple-300' : 'border-gray-200'}`}>
      <button
        onClick={onToggle}
        className={`w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors ${
          highlight ? 'bg-purple-50' : ''
        }`}
      >
        <span className={`font-bold text-sm ${highlight ? 'text-purple-900' : 'text-gray-900'}`}>
          {title}
        </span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50/50">
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
      <span className="text-gray-600 font-semibold min-w-[80px]">{label}:</span>
      <span className="text-gray-900 break-all">{value}</span>
    </div>
  )
}
