"use client"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useTargetingStore } from "@/lib/targeting-store"
import type { WarRoomScenario, HexData } from "@/lib/types"
import { UnitCounter } from "./unit-counter"

import { renderVisualAction, drawUnitStatus, drawThreatZone } from "@/lib/visual-action-library"
import { hydrateScenarioLayout } from "@/lib/grid-engine/layout-solver"
import { getHexCorners, hexToPixel } from "@/lib/grid-engine/hex-math"
import { Grid3X3 } from "lucide-react"
import rough from "roughjs"

interface WarRoomMapProps {
  scenario: WarRoomScenario
}

export function WarRoomMap({ scenario }: WarRoomMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRendered, setIsRendered] = useState(false)
  const selectedTactic = useTargetingStore((s) => s.selectedTactic)
  const visibleLayers = useTargetingStore((s) => s.visibleLayers)
  const history = useTargetingStore((s) => s.history)
  const historyIndex = useTargetingStore((s) => s.historyIndex)
  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const [showLegend, setShowLegend] = useState(false)

  // Hydration: One-time hydration on mount if needed
  useEffect(() => {
    if (!scenario.hexGrid) {
      console.log("[hydrate] Initial hydration for scenario:", scenario.id);
      // Scenarios should already be hydrated by the store, but this is a safety net
    }
  }, [scenario.id, scenario.hexGrid]);

  // Render canvas when scenario or visibility changes
  useEffect(() => {
    // Only render if we have a hexGrid (should be hydrated by store)
    if (!canvasRef.current || !scenario.hexGrid) {
      console.warn("Scenario not hydrated yet");
      return;
    }


    const canvas = canvasRef.current
    canvas.width = scenario.mapDimensions.width
    canvas.height = scenario.mapDimensions.height

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // RoughJS instance
    const rc = rough.canvas(canvas);

    ctx.fillStyle = "#F3E5AB"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // ... noise generation ... (simplifying for edit)
    const imageData = ctx.createImageData(canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 8
      data[i] += noise
      data[i + 1] += noise * 0.8
      data[i + 2] += noise * 0.6
      data[i + 3] = 40 
    }
    ctx.putImageData(imageData, 0, 0)

    // 2. Render Regions
    if (visibleLayers.regions) {
      scenario.mapRegions.forEach((region) => {
        // Fill
        ctx.beginPath();
        ctx.moveTo(region.points[0][0], region.points[0][1]);
        for(let i=1; i<region.points.length; i++) ctx.lineTo(region.points[i][0], region.points[i][1]);
        ctx.closePath();
        
        ctx.fillStyle = region.id === 'region-1' 
          ? "rgba(100, 149, 237, 0.1)" // Blue tint
          : "rgba(139, 69, 19, 0.1)"; // Brown tint
        ctx.fill();

        // Border (Rough)
        rc.polygon(region.points, {
           stroke: "#5d4037", strokeWidth: 2, roughness: 1.5, bowing: 2
        });
        
        // Label
        const centerX = region.points.reduce((sum, p) => sum + p[0], 0) / region.points.length
        const centerY = region.points.reduce((sum, p) => sum + p[1], 0) / region.points.length;
        
        ctx.save();
        ctx.fillStyle = "rgba(60, 40, 30, 0.5)";
        ctx.font = "italic small-caps 28px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(region.name, centerX, centerY);
        ctx.restore();
      })

      // River Overlay (The 'Front')
      const riverPath = [
         [400, 0], [420, 100], [380, 200], [410, 300], [390, 400], [400, 600]
      ] as [number, number][];
      
      rc.curve(riverPath, {
        stroke: "#3498db", strokeWidth: 5, roughness: 1.1, bowing: 1.5
      });
    }

    // 3. Render Hex Grid
    if (visibleLayers.grid && scenario.hexGrid) {
      scenario.hexGrid.forEach(hex => {
         // Use the single source of truth for geometry
         const cornersObj = getHexCorners({ x: hex.x, y: hex.y });
         const corners = cornersObj.map(p => [p.x, p.y] as [number, number]);
         
         // Style based on Phase 2 Layer System
         let fill = "rgba(255, 255, 255, 0.0)";
         let fillStyle = "solid";
         let stroke = "rgba(0,0,0,0.06)";
         let strokeWidth = 0.5;
         
         if (hex.structure === 'fortress') {
            fill = "rgba(100, 100, 100, 0.4)";
            fillStyle = "solid";
            stroke = "rgba(50, 50, 50, 0.8)";
            strokeWidth = 2;
         } else if (hex.structure === 'city_block' || hex.terrain === 'urban_ruins') {
            fill = "rgba(44, 62, 80, 0.3)";
            fillStyle = "cross-hatch";
            stroke = "rgba(44, 62, 80, 0.4)";
         } else if (hex.terrain === 'forest') {
            fill = "rgba(34, 139, 34, 0.15)";
            fillStyle = "hachure";
            stroke = "rgba(34, 139, 34, 0.3)";
         } else if (hex.terrain === 'swamp') {
            fill = "rgba(46, 204, 113, 0.1)";
            fillStyle = "dashed";
         } else if (hex.infrastructure?.includes('river')) {
            fill = "rgba(52, 152, 219, 0.3)";
            fillStyle = "zigzag";
            stroke = "rgba(52, 152, 219, 0.5)";
         }

         rc.polygon(corners, {
            fill: fill,
            fillStyle: fillStyle,
            stroke: stroke,
            strokeWidth: strokeWidth,
            roughness: 0.5
         });
      });
    }

    // 4. Render Unit Status Rings
    if (visibleLayers.units) {
      scenario.units.forEach((unit) => {
        // Skip units without hex coordinates
        if (!unit.hex) {
          console.warn(`Unit ${unit.id} has no hex coordinates, skipping canvas render`);
          return;
        }
        
        // Look up hex in hexIndex/hexGrid to get actual pixel position
        const hexKey = `${unit.hex!.q},${unit.hex!.r}`;
        const hexData = scenario.hexIndex?.[hexKey] ?? scenario.hexGrid?.find(h => h.q === unit.hex!.q && h.r === unit.hex!.r);
        if (!hexData) {
          console.warn(`Unit ${unit.id} hex not found in hexGrid`);
          return;
        }
        
        const loc = { x: hexData.x, y: hexData.y };
        
        if (unit.status) {
          drawUnitStatus(ctx, loc, unit.status, 32);
        }
      });
    }

    // 5. Render Tactical Actions (When Tactic Selected)
    // For historical rounds: show the tactic that was selected and executed in that round
    // For current round: show the tactic currently selected (if any), or none if not selected yet
    const isHistorical = historyIndex < history.length - 1
    const tacticToDisplay = isHistorical ? history[historyIndex]?.tacticUsed : selectedTactic
    console.debug('[render] tacticToDisplay', tacticToDisplay?.id ?? null, 'selectedTactic', selectedTactic?.id ?? null, 'isHistorical', isHistorical, 'historyIndex', historyIndex, 'historyLen', history.length, 'tacticUsed', history[historyIndex]?.tacticUsed?.id ?? null)
    console.debug('[render] visibleLayers.units', visibleLayers.units, 'scenario.hexGrid exists', !!scenario.hexGrid, 'scenario.units.length', scenario.units.length)
    if (tacticToDisplay && visibleLayers.units) {
      console.debug('[render] Rendering visual action for tactic', tacticToDisplay.id)
      const playerUnits = scenario.units.filter((u) => u.owner === "player")
      const enemyUnits = scenario.units.filter((u) => u.owner === "enemy")
      console.debug('[render] playerUnits count', playerUnits.length, 'enemyUnits count', enemyUnits.length)

      if (playerUnits.length > 0 && enemyUnits.length > 0) {
        playerUnits.forEach((playerUnit) => {
          // Look up player unit position in hexGrid
          if (!playerUnit.hex) return;
          const pKey = `${playerUnit.hex.q},${playerUnit.hex.r}`;
          const playerHexData = scenario.hexIndex?.[pKey] ?? scenario.hexGrid?.find(h => h.q === playerUnit.hex!.q && h.r === playerUnit.hex!.r);
          if (!playerHexData) return;
          const fromLoc = { x: playerHexData.x, y: playerHexData.y };

          // Find nearest enemy unit
          let nearestEnemy = null;
          let minDist = Infinity;
          
          enemyUnits.forEach((enemyUnit) => {
            if (!enemyUnit.hex) return;
            const eKey = `${enemyUnit.hex.q},${enemyUnit.hex.r}`;
            const enemyHexData = scenario.hexIndex?.[eKey] ?? scenario.hexGrid?.find(h => h.q === enemyUnit.hex!.q && h.r === enemyUnit.hex!.r);
            if (!enemyHexData) return;
            const enemyLoc = { x: enemyHexData.x, y: enemyHexData.y };            
            const dx = enemyLoc.x - fromLoc.x;
            const dy = enemyLoc.y - fromLoc.y;
            const dist = dx*dx + dy*dy;
            
            if (dist < minDist) {
              minDist = dist;
              nearestEnemy = enemyLoc;
            }
          });
          
          if (nearestEnemy) {
            console.debug('[render] Drawing visual action from', fromLoc, 'to', nearestEnemy, 'for tactic', tacticToDisplay.id)
            renderVisualAction(tacticToDisplay.semanticAction as any, {
              ctx,
              from: fromLoc,
              to: nearestEnemy,
              opacity: 1.0,
            });
          } else {
            console.debug('[render] No nearest enemy found for player unit', playerUnit.id)
          }
        });
      }
    }

    // 6. Render Visual Effects from AI Response
    const aiResponse = useTargetingStore.getState().gameResponse;
    if (aiResponse && aiResponse.visual_fx && visibleLayers.units) {
      aiResponse.visual_fx.forEach((fx) => {
        let fxLoc = { x: 400, y: 300 }; // Default center
        
        // Resolve effect location
        if (fx.target_unit) {
          const targetUnit = scenario.units.find(u => u.id === fx.target_unit);
          if (targetUnit?.hex) {
            const key = `${targetUnit.hex.q},${targetUnit.hex.r}`;
            const hexData = scenario.hexIndex?.[key] ?? scenario.hexGrid?.find(h => h.q === targetUnit.hex!.q && h.r === targetUnit.hex!.r);
            if (hexData) fxLoc = { x: hexData.x, y: hexData.y };
          }
        } else if (fx.region) {
          const region = scenario.mapRegions.find(r => r.id === fx.region);
          if (region) {
            const centerX = region.points.reduce((sum, p) => sum + p[0], 0) / region.points.length;
            const centerY = region.points.reduce((sum, p) => sum + p[1], 0) / region.points.length;
            fxLoc = { x: centerX, y: centerY };
          }
        }
        
        // Render effect based on type
        ctx.save();
        switch (fx.type) {
          case "DUST":
            ctx.fillStyle = "rgba(210, 180, 140, 0.4)";
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2;
              const r = 30 + Math.random() * 20;
              ctx.beginPath();
              ctx.arc(fxLoc.x + r * Math.cos(angle), fxLoc.y + r * Math.sin(angle), 8 + Math.random() * 4, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
            
          case "EXPLOSION":
            ctx.strokeStyle = "rgba(255, 100, 0, 0.8)";
            ctx.fillStyle = "rgba(255, 200, 0, 0.6)";
            ctx.lineWidth = 3;
            for (let i = 0; i < 12; i++) {
              const angle = (i / 12) * Math.PI * 2;
              const r = 20 + Math.random() * 15;
              ctx.beginPath();
              ctx.moveTo(fxLoc.x, fxLoc.y);
              ctx.lineTo(fxLoc.x + r * Math.cos(angle), fxLoc.y + r * Math.sin(angle));
              ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(fxLoc.x, fxLoc.y, 15, 0, Math.PI * 2);
            ctx.fill();
            break;
            
          case "SMOKE":
            ctx.fillStyle = "rgba(80, 80, 80, 0.5)";
            for (let i = 0; i < 6; i++) {
              const offsetX = (Math.random() - 0.5) * 40;
              const offsetY = (Math.random() - 0.5) * 40;
              ctx.beginPath();
              ctx.arc(fxLoc.x + offsetX, fxLoc.y + offsetY, 12 + Math.random() * 8, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
            
          case "FIRE":
            ctx.fillStyle = "rgba(255, 80, 0, 0.7)";
            ctx.strokeStyle = "rgba(255, 200, 0, 0.9)";
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2;
              const r = 15 + Math.random() * 10;
              const flameHeight = 20 + Math.random() * 15;
              ctx.beginPath();
              ctx.moveTo(fxLoc.x + r * Math.cos(angle), fxLoc.y + r * Math.sin(angle));
              ctx.lineTo(fxLoc.x + r * Math.cos(angle), fxLoc.y + r * Math.sin(angle) - flameHeight);
              ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(fxLoc.x, fxLoc.y, 18, 0, Math.PI * 2);
            ctx.fill();
            break;
            
          case "IMPACT":
            ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
            ctx.lineWidth = 4;
            for (let i = 0; i < 4; i++) {
              const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
              const len = 25;
              ctx.beginPath();
              ctx.moveTo(fxLoc.x - len * Math.cos(angle) / 2, fxLoc.y - len * Math.sin(angle) / 2);
              ctx.lineTo(fxLoc.x + len * Math.cos(angle) / 2, fxLoc.y + len * Math.sin(angle) / 2);
              ctx.stroke();
            }
            break;
            
          case "MUD_SPLAT":
            ctx.fillStyle = "rgba(101, 67, 33, 0.6)";
            for (let i = 0; i < 10; i++) {
              const offsetX = (Math.random() - 0.5) * 50;
              const offsetY = (Math.random() - 0.5) * 50;
              ctx.beginPath();
              ctx.arc(fxLoc.x + offsetX, fxLoc.y + offsetY, 5 + Math.random() * 5, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
        }
        ctx.restore();
      });
    }

    setIsRendered(true)
  }, [scenario.id, scenario.hexGrid, scenario.units, selectedTactic, visibleLayers]) // Fixed dep array to prevent rerenders

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: isRendered ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-full overflow-auto"
    >
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="p-2.5 bg-amber-900/10 hover:bg-amber-900/20 rounded-lg transition-colors text-amber-800 backdrop-blur-sm border border-amber-900/15"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="p-2.5 bg-amber-900/10 hover:bg-amber-900/20 rounded-lg transition-colors text-amber-800 backdrop-blur-sm border border-amber-900/15 font-serif font-bold text-sm"
          title="Visual Action Legend"
        >
          ?
        </button>
      </div>

      {showLayerPanel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-14 left-4 z-20 bg-amber-50/95 backdrop-blur-sm rounded-lg border border-amber-900/15 shadow-lg p-3 min-w-40"
        >
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer hover:text-amber-700 transition-colors">
              <input
                type="checkbox"
                checked={visibleLayers.grid}
                onChange={() => useTargetingStore.getState().toggleLayer("grid")}
                className="w-4 h-4"
              />
              <span className="font-serif">Grid</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-amber-700 transition-colors">
              <input
                type="checkbox"
                checked={visibleLayers.units}
                onChange={() => useTargetingStore.getState().toggleLayer("units")}
                className="w-4 h-4"
              />
              <span className="font-serif">Units</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-amber-700 transition-colors">
              <input
                type="checkbox"
                checked={visibleLayers.terrain}
                onChange={() => useTargetingStore.getState().toggleLayer("terrain")}
                className="w-4 h-4"
              />
              <span className="font-serif">Terrain</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-amber-700 transition-colors">
              <input
                type="checkbox"
                checked={visibleLayers.regions}
                onChange={() => useTargetingStore.getState().toggleLayer("regions")}
                className="w-4 h-4"
              />
              <span className="font-serif">Regions</span>
            </label>
          </div>
        </motion.div>
      )}

      {/* Unit Layer (HTML Overlay) */}
      {visibleLayers.units && (
         <div className="absolute inset-0 pointer-events-none z-10">
            {scenario.units.map(unit => (
               <div key={unit.id} className="pointer-events-auto absolute" style={{ width: 0, height: 0 }}>
                  <UnitCounter unit={unit} />
               </div>
            ))}
         </div>
      )}

      <canvas
        ref={canvasRef}
        className="block cursor-crosshair"
        style={{
          imageRendering: "auto",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
          minWidth: scenario.mapDimensions.width,
          minHeight: scenario.mapDimensions.height,
        }}
      />

      {/* Visual Action Legend Modal */}
      {showLegend && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLegend(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-amber-50 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-amber-900/20 backdrop-blur-sm"
          >
            <div className="p-6">
              <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4">Visual Action Legend</h2>
              <p className="text-amber-800/80 text-sm mb-6 font-serif">
                Tactical arrows and symbols show the nature of military operations when you select a strategy.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LegendItem 
                  title="ADVANCE" 
                  color="#2c3e50" 
                  description="Straight arrow - Forward movement of forces"
                />
                <LegendItem 
                  title="ASSAULT" 
                  color="#c0392b" 
                  description="Thick arrow with limit bar - Direct attack"
                />
                <LegendItem 
                  title="FLANK LEFT/RIGHT" 
                  color="#f39c12" 
                  description="Curved arrow - Flanking maneuver"
                />
                <LegendItem 
                  title="ENCIRCLE" 
                  color="#8e44ad" 
                  description="Dual curved arrows - Surround enemy"
                />
                <LegendItem 
                  title="BOMBARD" 
                  color="#e74c3c" 
                  description="Starburst pattern - Artillery bombardment"
                />
                <LegendItem 
                  title="SUPPRESS" 
                  color="rgba(231, 76, 60, 0.6)" 
                  description="Cone of dots - Suppressive fire"
                />
                <LegendItem 
                  title="FORTIFY" 
                  color="#34495e" 
                  description="Sawtooth line - Defensive positions"
                />
                <LegendItem 
                  title="RETREAT" 
                  color="#95a5a6" 
                  description="Dashed arrow - Tactical withdrawal"
                />
                <LegendItem 
                  title="INFILTRATE" 
                  color="#27ae60" 
                  description="Serpentine line - Stealth movement"
                />
                <LegendItem 
                  title="AMBUSH" 
                  color="#16a085" 
                  description="Question mark - Hidden forces"
                />
                <LegendItem 
                  title="SPEARHEAD" 
                  color="#2c3e50" 
                  description="Bold arrow - Concentrated breakthrough"
                />
                <LegendItem 
                  title="FEINT" 
                  color="#95a5a6" 
                  description="Phantom arrow - Deceptive maneuver"
                />
              </div>
              
              <div className="mt-6 pt-4 border-t border-amber-900/20">
                <h3 className="font-serif font-bold text-amber-900 mb-3">Unit Status Rings</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatusLegendItem color="#27ae60" label="Fresh" description="Solid ring" />
                  <StatusLegendItem color="#e67e22" label="Engaged" description="Short dashes" />
                  <StatusLegendItem color="#e74c3c" label="Wavering" description="Long dashes" />
                  <StatusLegendItem color="#95a5a6" label="Routing" description="Faded blur" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

function LegendItem({ title, color, description }: { title: string; color: string; description: string }) {
  return (
    <div className="p-3 bg-white/50 rounded-lg border border-amber-900/10">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded" style={{ backgroundColor: color, opacity: 0.7 }} />
        <span className="font-serif font-bold text-sm text-amber-900">{title}</span>
      </div>
      <p className="text-xs text-amber-800/70 font-serif">{description}</p>
    </div>
  )
}

function StatusLegendItem({ color, label, description }: { color: string; label: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full mx-auto mb-1 border-2" style={{ borderColor: color }} />
      <div className="font-serif font-bold text-xs text-amber-900">{label}</div>
      <div className="text-xs text-amber-800/60">{description}</div>
    </div>
  )
}
