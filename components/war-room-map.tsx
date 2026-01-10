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
  const { selectedTactic, visibleLayers, setScenario, updateScenarioLayout } = useTargetingStore()
  const [showLayerPanel, setShowLayerPanel] = useState(false)

  // Hydration: measure container and hydrate scenario to actual pixel dims
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measureAndMaybeHydrate = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);

      // Only re-hydrate if dimensions have changed significantly (>2px) to avoid rounding jitter
      // or if grid is missing
      const dimMismatch = Math.abs(scenario.mapDimensions.width - width) > 2 || 
                          Math.abs(scenario.mapDimensions.height - height) > 2;

      const needsHydrate = !scenario.hexGrid || dimMismatch;
      
      if (needsHydrate && width > 0 && height > 0) {
        console.log("[hydrate] Re-hydrating scenario:", scenario.id, "with", width, "x", height);
        const hydrated = hydrateScenarioLayout(scenario, width, height);
        updateScenarioLayout(hydrated);
      }
    };

    // Initial measure
    measureAndMaybeHydrate();

    // Observe resize and re-hydrate if size changes
    const ro = new ResizeObserver(() => measureAndMaybeHydrate());
    ro.observe(el);
    return () => ro.disconnect();
  }, [scenario.id, containerRef.current, scenario.hexGrid, scenario.mapDimensions, updateScenarioLayout]);

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
         } else if (hex.structure === 'city_block' || hex.terrain === 'urban_ruins' || hex.terrain === 'urban') {
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
         } else if (hex.terrain === 'river') {
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
    if (selectedTactic && visibleLayers.units) {
      const playerUnits = scenario.units.filter((u) => u.owner === "player")
      const enemyUnits = scenario.units.filter((u) => u.owner === "enemy")

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
            renderVisualAction(selectedTactic.semanticAction as any, {
              ctx,
              from: fromLoc,
              to: nearestEnemy,
              opacity: 0.6,
            });
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
  }, [scenario.id, scenario.hexGrid, selectedTactic, visibleLayers]) // Fixed dep array to prevent rerenders

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: isRendered ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-full"
    >
      <button
        onClick={() => setShowLayerPanel(!showLayerPanel)}
        className="absolute top-4 left-4 z-20 p-2.5 bg-amber-900/10 hover:bg-amber-900/20 rounded-lg transition-colors text-amber-800 backdrop-blur-sm border border-amber-900/15"
      >
        <Grid3X3 className="w-5 h-5" />
      </button>

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
        className="w-full h-full block cursor-crosshair"
        style={{
          imageRendering: "auto",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
        }}
      />
    </motion.div>
  )
}
