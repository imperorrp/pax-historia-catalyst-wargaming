"use client"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useTargetingStore } from "@/lib/targeting-store"
import type { WarRoomScenario, HexData } from "@/lib/types"
import { UnitCounter } from "./unit-counter"

import { renderVisualAction, renderVisualEffect, drawUnitStatus } from "@/lib/visual-action-library"
import { getHexCorners } from "@/lib/grid-engine/hex-math"
import { getBoundingBox, isPointInPolygon, drawScatterProps, drawRiver, findSharedEdges } from "@/components/map/map-utils"
import { LegendItem, StatusLegendItem, VisualEffectLegendItem } from "@/components/map/MapLegend"
import { MapControls } from "@/components/map/MapControls"
import { MapLegendModal } from "@/components/map/MapLegendModal"
import { Grid3X3 } from "lucide-react"
import rough from "roughjs"

interface WarRoomMapProps {
  scenario: WarRoomScenario
}

// Map geometry & rendering helpers imported from components/map/map-utils

export function WarRoomMap({ scenario }: WarRoomMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRendered, setIsRendered] = useState(false)
  const selectedTactic = useTargetingStore((s) => s.selectedTactic)
  const visibleLayers = useTargetingStore((s) => s.visibleLayers)
  const debugMode = useTargetingStore((s) => s.debugMode)
  const history = useTargetingStore((s) => s.history)
  const historyIndex = useTargetingStore((s) => s.historyIndex)
  const gameResponse = useTargetingStore((s) => s.gameResponse)
  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null); // NEW STATE
  const [tick, setTick] = useState(0); // Animation Frame Tick

  // Zoom and Pan State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })

  // Debugging report for action rendering issues
  const [debugReport, setDebugReport] = useState<any[] | null>(null)

  function analyzeActions() {
    try {
      const issues: any[] = [];
      // Offscreen canvas for renderer tests
      const off = document.createElement('canvas') as HTMLCanvasElement;
      off.width = 10; off.height = 10;
      const offCtx = off.getContext('2d')!;

      const playerUnits = scenario.units.filter((u) => u.owner === "player")
      const enemyUnits = scenario.units.filter((u) => u.owner === "enemy")

      if (playerUnits.length === 0) {
        issues.push({ severity: 'warn', message: 'No player units found in scenario' })
      }

      playerUnits.forEach((playerUnit) => {
        const fromLoc = getUnitPixel(playerUnit)
        if (!fromLoc) {
          issues.push({ severity: 'error', message: `Unit ${playerUnit.id} missing hex/pixel` });
        }

        scenario.options.forEach((tactic) => {
          const actionsToRender = tactic.compositeActions && tactic.compositeActions.length > 0
            ? tactic.compositeActions
            : [{ semanticAction: tactic.semanticAction, targetLogic: tactic.targetLogic, targetRegionId: tactic.targetRegionId, requiredUnitTypes: tactic.requiredUnitTypes }]

          actionsToRender.forEach((action) => {
            if (Array.isArray(action.requiredUnitTypes) && action.requiredUnitTypes.length > 0 && !action.requiredUnitTypes.includes(playerUnit.type)) {
              // Not an issue—just not applicable to this unit
              return;
            }

            // Resolve target loc using the same logic as render loop
            let targetLoc: {x:number,y:number} | null = null
            const logic = action.targetLogic ?? tactic.targetLogic
            switch(logic) {
              case 'center_mass':
                targetLoc = {
                  x: enemyUnits.reduce((sum, u) => sum + (getUnitPixel(u)?.x || 0), 0) / (enemyUnits.length || 1),
                  y: enemyUnits.reduce((sum, u) => sum + (getUnitPixel(u)?.y || 0), 0) / (enemyUnits.length || 1),
                }
                break;
              case 'flank_left':
                targetLoc = getUnitPixel([...enemyUnits].sort((a,b)=> (getUnitPixel(a)?.x||0) - (getUnitPixel(b)?.x||0))[0])
                break;
              case 'flank_right':
                const sorted = [...enemyUnits].sort((a,b)=> (getUnitPixel(a)?.x||0) - (getUnitPixel(b)?.x||0));
                targetLoc = getUnitPixel(sorted[sorted.length-1])
                break;
              case 'specific_region':
                if (action.targetRegionId) {
                  const r = scenario.mapRegions.find(r => r.id === action.targetRegionId);
                  if (r && r.points && r.points.length>0) {
                    const cx = r.points.reduce((s,p)=>s+p[0],0)/r.points.length;
                    const cy = r.points.reduce((s,p)=>s+p[1],0)/r.points.length;
                    targetLoc = {x:cx,y:cy}
                  } else {
                    issues.push({ severity: 'error', message: `Tactic ${tactic.id} references missing/empty region ${action.targetRegionId}` })
                  }
                }
                break;
              case 'self':
                targetLoc = fromLoc
                break;
              case 'nearest':
              default:
                let min = Infinity
                enemyUnits.forEach(e=>{ const eLoc=getUnitPixel(e); if(!eLoc) return; const d=(eLoc.x-(fromLoc?.x||0))**2 + (eLoc.y-(fromLoc?.y||0))**2; if(d<min){min=d;targetLoc=eLoc}})
                break;
            }

            if (!fromLoc) return; // already logged

            if (!targetLoc) {
              issues.push({ severity: 'warn', message: `Tactic ${tactic.id}/${action.semanticAction} unable to resolve target for unit ${playerUnit.id}` })
              return
            }

            // Test renderer presence by calling renderVisualAction with offscreen context
            const drawn = renderVisualAction(action.semanticAction as any, { ctx: offCtx, from: fromLoc, to: targetLoc, opacity: 0.9 })
            if (!drawn) {
              issues.push({ severity: 'error', message: `No renderer for action ${action.semanticAction} (tactic ${tactic.id})` })
            }
          })
        })
      })

      setDebugReport(issues)
      console.info('[Action Debug] Found', issues.length, 'issues. See debugReport state or console for details.');
      issues.forEach(i=>{ if(i.severity==='error') console.error(i.message); else console.warn(i.message) })
    } catch (err) {
      console.error('[analyzeActions] Exception', err)
    }
  }
  const [lastPinchDist, setLastPinchDist] = useState<number | null>(null)

  const handleWheel = (e: React.WheelEvent) => {
    // Avoid calling preventDefault inside potentially passive listeners. We rely on CSS to prevent page scroll and only adjust zoom here.
    const scaleSensitivity = 0.001
    const newScale = Math.min(Math.max(0.25, transform.scale - e.deltaY * scaleSensitivity), 4)
    setTransform(prev => ({ ...prev, scale: newScale }))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - lastMousePos.x
    const dy = e.clientY - lastMousePos.y
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch handlers for mobile drag support
  const handleTouchStart = (e: React.TouchEvent) => {
    // touch-action: none is enabled on the container; explicit preventDefault is not necessary and can cause passive listener warnings
    if (e.touches.length === 1) {
      setIsDragging(true)
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      setLastPinchDist(dist)
      setIsDragging(false)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // touch-action: none is enabled on the container; explicit preventDefault is not necessary and can cause passive listener warnings
    if (e.touches.length === 1 && isDragging) {
      // Single finger drag
      const dx = e.touches[0].clientX - lastMousePos.x
      const dy = e.touches[0].clientY - lastMousePos.y
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    } else if (e.touches.length === 2 && lastPinchDist !== null) {
      // Pinch zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const delta = dist - lastPinchDist
      const scaleSensitivity = 0.01
      const newScale = Math.min(Math.max(0.25, transform.scale + delta * scaleSensitivity), 4)
      setTransform(prev => ({ ...prev, scale: newScale }))
      setLastPinchDist(dist)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    setLastPinchDist(null)
  }

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

    console.log('[RENDER DEBUG] Starting canvas render. Scenario:', scenario.id, 'hexGrid size:', scenario.hexGrid.length, 'units:', scenario.units.length);
    console.log('[RENDER DEBUG] Sample unit hex coords:', scenario.units.slice(0, 3).map(u => ({ id: u.id, hex: u.hex })));

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

    // 2. Render Regions (With better colors and scatter props!)
    if (visibleLayers.regions) {
      scenario.mapRegions.forEach((region) => {
        const isHovered = hoveredRegion === region.id;
        
        // Determine Style based on Terrain + Hover State
        let fill = "rgba(139, 69, 19, 0.05)"; // Default ground
        let stroke = "#8d6e63";
        let fillStyle = "solid";
        let strokeWidth = 1.5;
        let roughness = 1;
        let bowing = 1;

        // 1. Detect Scale Type
        const isStrategic = scenario.scaleType === 'grand_strategy';

        // 2. STRATEGIC VISUAL OVERRIDES
        if (isStrategic) {
          roughness = 0; // Clean lines, no sketchiness
          bowing = 0;    // Straight geometry
          fillStyle = "solid"; // Atlas style maps are solid blocks of color
          strokeWidth = 1; 
          
          // Color Coding by "Political Ownership" logic
          // (Simplified logic: if player unit inside -> Blueish, Enemy -> Reddish, Else -> Grey)
          // In a real app, 'owner' would be on the region-state object.
          const hasPlayer = scenario.units.some(u => u.owner === 'player' && u.placement?.regionId === region.id);
          const hasEnemy = scenario.units.some(u => u.owner === 'enemy' && u.placement?.regionId === region.id);

          if (region.terrain === 'ocean') {
               fill = "#a5c9e1"; // Map Blue
               stroke = "#8fb0c6";
          } else if (hasPlayer) {
               fill = "rgba(52, 152, 219, 0.2)"; // Friendly Territory
               stroke = "#2980b9";
          } else if (hasEnemy) {
               fill = "rgba(231, 76, 60, 0.2)"; // Hostile Territory
               stroke = "#c0392b";
          } else {
               fill = "#ecf0f1"; // Neutral/Fog
               stroke = "#bdc3c7";
          }
       }

        switch (region.terrain) {
          case 'river':
          case 'water':
          case 'ocean':
            // More distinct Blue, less scratchy
            // Only apply if not overridden by strategic mode (though strategic handles ocean above)
            if (!isStrategic || region.terrain !== 'ocean') {
                 fill = isHovered ? "rgba(33, 150, 243, 0.6)" : "rgba(41, 128, 185, 0.35)"; 
                 stroke = "rgba(41, 128, 185, 0.45)"; // Faint blue border
                 fillStyle = "solid"; // Solid water looks better than scratchy zigzag
                 roughness = 0.5; // Smooth water
                 bowing = 0.2;
            }
            break;
          case 'forest':
            if (!isStrategic) {
                 fill = isHovered ? "rgba(56, 142, 60, 0.35)" : "rgba(56, 142, 60, 0.25)";
                 stroke = "#2e7d32";
                 fillStyle = "cross-hatch";
                 roughness = 1.2;
            }
            break;
          case 'mountain':
            if (!isStrategic) {
                 fill = isHovered ? "rgba(117, 117, 117, 0.4)" : "rgba(117, 117, 117, 0.3)";
                 stroke = "#424242";
                 fillStyle = "hachure";
                 roughness = 1.5;
            }
            break;
          case 'swamp':
          case 'mud':
            if (!isStrategic) {
                 fill = isHovered ? "rgba(101, 67, 33, 0.45)" : "rgba(78, 52, 46, 0.35)";
                 stroke = "#3e2723";
                 fillStyle = "dots"; // Muddy texture
            }
            break;
          case 'urban':
            if (!isStrategic) {
                 fill = isHovered ? "rgba(100, 100, 100, 0.35)" : "rgba(100, 100, 100, 0.25)";
                 stroke = "#000";
                 fillStyle = "solid";
            }
            break;
        }

        // Highlight Override
        if (isHovered && region.terrain !== 'river') {
            strokeWidth = 2; // Reduced from 3
        }

        // Draw the region background
        if (region.subPolygons && region.subPolygons.length > 0) {
           // OVERRIDE: Use faint strokes for sub-polygons so they are visible but not "Bold"
           // Use the determined stroke color but with much lower opacity if it wasn't already faint
           let shardStroke = stroke;
           if (!shardStroke.startsWith("rgba")) {
              // Convert hex to faint rgba - cheating a bit by just using a standard shadow color
              shardStroke = "rgba(0,0,0,0.1)"; 
              if (region.terrain === 'river') shardStroke = "rgba(33, 150, 243, 0.2)";
           }
           
           const shardWidth = 0.5; // Fine line

           // Painter's Algorithm Mode
           region.subPolygons.forEach((poly: any) => {
               rc.polygon(poly, {
                 fill, 
                 stroke: shardStroke, 
                 strokeWidth: shardWidth, 
                 fillStyle, 
                 fillWeight: 0.5, // Lighter internal fill pattern
                 roughness: 0.4 // Very clean internal lines
               });
           });

           // OPTIONAL: Highlight border on Hover to show region extent
           // IMPROVED: Draw the OUTER BOUNDARY (Hull) strongly, and internal cells faintly
           if (isHovered) {
              // 1. Draw Outer Boundary (Hull)
              rc.polygon(region.points, {
                 fill: 'none', 
                 stroke: region.terrain === 'river' ? '#1976D2' : '#d84315', 
                 strokeWidth: 2,
                 roughness: 1
              });
           }

           // Draw Scatter Props on sub-polygons
           if (visibleLayers.terrain) {
             region.subPolygons.forEach((poly: any) => {
                drawScatterProps(rc, poly, region.terrain || 'plains');
             });
           }

        } else {
           // Legacy / Simple Voronoi Mode
           rc.polygon(region.points, {
              fill, stroke, strokeWidth, roughness, bowing, fillStyle, fillWeight: 1
           });

           // NEW: Draw Scatter Props based on terrain
           if (visibleLayers.terrain) {
             drawScatterProps(rc, region.points, region.terrain || 'plains');
           }
        }
      })
    }

    // NEW: Render Rivers as Border Features (Legacy Support)
    if (scenario.rivers && visibleLayers.terrain) {
      scenario.rivers.forEach(river => {
        drawRiver(rc, scenario.mapRegions, river);
      });
    }

    // NEW: Render Visual Decorations (Labels, Visual Rivers, Roads)
    if (scenario.decorations && visibleLayers.terrain) {
      scenario.decorations.forEach(deco => {
        if (deco.type === 'river') {
          // Draw smooth curve for rivers
          if (deco.points.length > 1) {
             rc.curve(deco.points, {
               stroke: deco.color || '#2980b9',
               strokeWidth: deco.width || 3,
               roughness: 0.8,
               bowing: 1.5 // More curve
             });
          }
        } else if (deco.type === 'road') {
           if (deco.points.length > 1) {
             rc.curve(deco.points, {
               stroke: deco.color || '#5d4037',
               strokeWidth: deco.width || 3,
               roughness: 0.5,
               strokeLineDash: deco.style === 'dashed' ? [5, 5] : undefined
             });
           }
        } else if (deco.type === 'label' && deco.points.length > 0) {
           const [x, y] = deco.points[0];
           ctx.save();
           ctx.font = "italic bold 16px 'Crimson Text', serif";
           ctx.fillStyle = deco.color || "rgba(0,0,0,0.6)";
           ctx.shadowColor = "rgba(255,255,255,0.8)";
           ctx.shadowBlur = 4;
           ctx.textAlign = "center";
           ctx.fillText(deco.label || "", x, y);
           ctx.restore();
        }
      });
    }

    // 3. Render Hex Grid & Terrain
    if (scenario.hexGrid) {
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
            // Urban areas should be clearly visible
            fill = visibleLayers.terrain ? "rgba(44, 62, 80, 0.45)" : "rgba(255,255,255,0.0)";
            fillStyle = "cross-hatch";
            stroke = "rgba(44, 62, 80, 0.6)";
         } else if (visibleLayers.terrain && hex.terrain === 'forest') {
            // Make forests more visible with denser hachures and stronger stroke
            fill = "rgba(34, 139, 34, 0.3)";
            fillStyle = "hachure";
            stroke = "rgba(34, 139, 34, 0.5)";
            strokeWidth = 1;
         } else if (visibleLayers.terrain && hex.terrain === 'swamp') {
            fill = "rgba(46, 204, 113, 0.18)";
            fillStyle = "dashed";
            stroke = "rgba(34, 139, 34, 0.35)";
         } else if (visibleLayers.terrain && hex.infrastructure?.includes('river')) {
            // Rivers fill when terrain layer is on; otherwise keep transparent
            fill = "rgba(52, 152, 219, 0.45)";
            fillStyle = "solid";
            stroke = "rgba(52, 152, 219, 0.65)";
            strokeWidth = 1.2;
         }

         // If grid lines are hidden, mute stroke appearance
         if (!visibleLayers.grid) {
           stroke = 'rgba(0,0,0,0)';
           strokeWidth = 0;
         }

         rc.polygon(corners, {
            fill: fill,
            fillStyle: fillStyle,
            stroke: stroke,
            strokeWidth: strokeWidth,
            roughness: 0.5,
            // For hachure-heavy fills, slightly tighten the gap for visual density
            hachureGap: fillStyle === 'hachure' ? 6 : undefined
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

    // 5. Render Tactical Actions (Logic Updated)
    const isHistorical = historyIndex < history.length - 1
    const tacticToDisplay = isHistorical ? history[historyIndex]?.tacticUsed : selectedTactic

    console.log('[RENDER DEBUG] tacticToDisplay:', tacticToDisplay?.id, 'visibleLayers.units:', visibleLayers.units, 'selectedTactic:', selectedTactic?.id);

    if (tacticToDisplay && visibleLayers.units) {
      const playerUnits = scenario.units.filter((u) => u.owner === "player")
      const enemyUnits = scenario.units.filter((u) => u.owner === "enemy")

      console.log('[RENDER DEBUG] playerUnits:', playerUnits.length, 'enemyUnits:', enemyUnits.length);

      if (playerUnits.length > 0 && enemyUnits.length > 0) {
        
        // Calculate Enemy Centroid for 'center_mass' logic
        const enemyCentroid = {
           x: enemyUnits.reduce((sum, u) => sum + (getUnitPixel(u)?.x || 0), 0) / enemyUnits.length,
           y: enemyUnits.reduce((sum, u) => sum + (getUnitPixel(u)?.y || 0), 0) / enemyUnits.length
        }

        // Sort enemies by X coordinate for Flank logic
        const enemiesSortedX = [...enemyUnits].sort((a,b) => (getUnitPixel(a)?.x||0) - (getUnitPixel(b)?.x||0));

        // Get composite actions or fallback to single action
        const actionsToRender = tacticToDisplay.compositeActions && tacticToDisplay.compositeActions.length > 0 
          ? tacticToDisplay.compositeActions 
          : [{ semanticAction: tacticToDisplay.semanticAction, targetLogic: tacticToDisplay.targetLogic, targetRegionId: tacticToDisplay.targetRegionId, requiredUnitTypes: tacticToDisplay.requiredUnitTypes }]

        console.log('[RENDER DEBUG] actionsToRender:', actionsToRender.map(a => ({ action: a.semanticAction, logic: a.targetLogic, unitTypes: a.requiredUnitTypes })));

        playerUnits.forEach((playerUnit) => {
          actionsToRender.forEach((action, actionIndex) => {
            console.log(`[RENDER DEBUG] Processing unit ${playerUnit.id} (${playerUnit.type}) for action ${action.semanticAction}`);
            
            // Check if this unit type is relevant for the action
            if (Array.isArray(action.requiredUnitTypes) && action.requiredUnitTypes.length > 0 && !action.requiredUnitTypes.includes(playerUnit.type)) {
              console.warn(`[render] Skip action ${action.semanticAction} for unit ${playerUnit.id} due to unit type mismatch (required: ${action.requiredUnitTypes.join(',')}, unit: ${playerUnit.type})`);
               return; 
            }

            const fromLoc = getUnitPixel(playerUnit);
            if (!fromLoc) {
              console.warn(`[render] Unit ${playerUnit.id} has no pixel (hex missing), skipping action ${action.semanticAction}`);
              return;
            }

            console.log(`[RENDER DEBUG] fromLoc for ${playerUnit.id}:`, fromLoc);

            let targetLoc = null;

            // --- SMART TARGETING LOGIC ---
            const logic = action.targetLogic ?? tacticToDisplay.targetLogic
            console.log(`[RENDER DEBUG] Resolved targetLogic for ${action.semanticAction}: ${logic} (action.targetLogic: ${action.targetLogic}, tactic.targetLogic: ${tacticToDisplay.targetLogic})`);
            
            switch(logic) {
              case "self":
                targetLoc = fromLoc
                console.log(`[RENDER DEBUG] Set targetLoc to fromLoc (self):`, targetLoc);
                break;
               case "center_mass":
                  targetLoc = enemyCentroid;
                  break;
               case "flank_left":
                  // Target enemy's rightmost unit (Player's left perspective usually, or absolute map left?)
                  // Let's assume Map Left = Low X.
                  targetLoc = getUnitPixel(enemiesSortedX[0]); // Leftmost enemy
                  break;
               case "flank_right":
                  targetLoc = getUnitPixel(enemiesSortedX[enemiesSortedX.length-1]); // Rightmost enemy
                  break;
               case "specific_region":
                  if (action.targetRegionId) {
                     const r = scenario.mapRegions.find(r => r.id === action.targetRegionId);
                     if (r && r.points && r.points.length > 0) {
                        // rough centroid
                        const cx = r.points.reduce((s,p)=>s+p[0],0)/r.points.length;
                        const cy = r.points.reduce((s,p)=>s+p[1],0)/r.points.length;
                        targetLoc = {x:cx, y:cy};
                     } else {
                        console.warn(`[render] Specific region ${action.targetRegionId} for action ${action.semanticAction} not found or has no points`);
                     }
                  }
                  break;
               case "nearest":
               default:
                  // Find nearest enemy (Classic logic)
                  let minDist = Infinity;
                  enemyUnits.forEach(e => {
                     const eLoc = getUnitPixel(e);
                     if(!eLoc) return;
                     const d = (eLoc.x-fromLoc.x)**2 + (eLoc.y-fromLoc.y)**2;
                     if(d < minDist) { minDist = d; targetLoc = eLoc; }
                  });
                  break;
            }
            
            if (targetLoc) {
              // Stagger opacity for multiple actions to show sequence
              const baseOpacity = 0.8;
              const opacityStep = actionsToRender.length > 1 ? 0.2 / actionsToRender.length : 0;
              const opacity = Math.max(0.3, baseOpacity - (actionIndex * opacityStep));
              
              console.log(`[RENDER DEBUG] Calling renderVisualAction for ${action.semanticAction} with from:`, fromLoc, 'to:', targetLoc, 'opacity:', opacity);
              
              const drawn = renderVisualAction(action.semanticAction as any, {
                ctx,
                from: fromLoc,
                to: targetLoc,
                opacity: opacity,
              });

              console.log(`[RENDER DEBUG] renderVisualAction returned: ${drawn} for ${action.semanticAction}`);

              if (!drawn) {
                console.warn(`[render] Action ${action.semanticAction} not drawn (no renderer) for unit ${playerUnit.id} -> target ${action.targetLogic}${action.targetRegionId ? ' '+action.targetRegionId : ''}`);
              }
            } else {
              console.warn(`[render] Could not resolve target location for action ${action.semanticAction} from unit ${playerUnit.id} with targetLogic ${action.targetLogic}`);
            }
          });
        });
      }
    }

    // 6. Render Visual Effects from AI Response
    if (gameResponse && gameResponse.visual_fx && visibleLayers.units) {
      gameResponse.visual_fx.forEach((fx) => {
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
        renderVisualEffect(fx.type, {
          ctx,
          location: fxLoc,
          opacity: 0.9,
        });
      });
    }

    // 7. Debug Overlays (when debug mode is enabled)
    if (debugMode && visibleLayers.units) {
      ctx.save();
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      
      // Show hex coordinates on units
      scenario.units.forEach(unit => {
        if (unit.hex) {
          const key = `${unit.hex.q},${unit.hex.r}`;
          const hexData = scenario.hexIndex?.[key] ?? scenario.hexGrid?.find(h => h.q === unit.hex!.q && h.r === unit.hex!.r);
          if (hexData) {
            const loc = { x: hexData.x, y: hexData.y };
            
            // Background for readability
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(loc.x - 20, loc.y + 25, 40, 12);
            
            // Hex coordinates
            ctx.fillStyle = "#00ff00";
            ctx.fillText(`(${unit.hex.q},${unit.hex.r})`, loc.x, loc.y + 35);
          }
        }
      });

      // Show region centroids and IDs
      if (visibleLayers.regions) {
        scenario.mapRegions.forEach(region => {
          if (region.centroid || region.points.length > 0) {
            const cx = region.centroid?.x || region.points.reduce((s,p)=>s+p[0],0)/region.points.length;
            const cy = region.centroid?.y || region.points.reduce((s,p)=>s+p[1],0)/region.points.length;
            
            // Draw crosshair at centroid
            ctx.strokeStyle = "rgba(255, 0, 255, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy);
            ctx.lineTo(cx + 10, cy);
            ctx.moveTo(cx, cy - 10);
            ctx.lineTo(cx, cy + 10);
            ctx.stroke();
            
            // Region ID
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(cx - 40, cy - 20, 80, 14);
            ctx.fillStyle = "#ff00ff";
            ctx.fillText(region.id, cx, cy - 10);
          }
        });
      }
      
      ctx.restore();
    }

    setIsRendered(true)
  }, [scenario.id, scenario.hexGrid, scenario.units, selectedTactic, visibleLayers, hoveredRegion, debugMode, gameResponse, tick]) // Added tick for animation

  // Animation Loop for Visual Effects
  useEffect(() => {
    let animId: number;
    // Only animate if there are active visual effects
    if (gameResponse?.visual_fx && gameResponse.visual_fx.length > 0) {
      const loop = () => {
        setTick(t => t + 1);
        animId = requestAnimationFrame(loop);
      }
      // Lower frame rate slightly to save performance? No, let's go full speed
      animId = requestAnimationFrame(loop);
    }
    return () => {
      if(animId) cancelAnimationFrame(animId);
    }
  }, [gameResponse?.visual_fx]);

  const [clientReady, setClientReady] = useState(false);
  useEffect(() => { setClientReady(true) }, []);

  // --- IMPROVED LABEL RENDERING WITH VORONOI CENTROIDS ---
  const renderLabels = () => {
    if (!visibleLayers.regions) return null;

    // Use centroids from Voronoi generator for better positioning
    const positions = scenario.mapRegions.map(region => {
       // Use stored centroid if available, otherwise calculate
       const cx = region.centroid?.x ?? region.points.reduce((s,p)=>s+p[0],0)/region.points.length;
       const cy = region.centroid?.y ?? region.points.reduce((s,p)=>s+p[1],0)/region.points.length;
       return { id: region.id, name: region.name, x: cx, y: cy };
    });

    // Enhanced collision avoidance with force-directed positioning
    const iterations = 20;
    const minSeparation = 120; // Minimum pixel distance between labels

    for (let iter = 0; iter < iterations; iter++) {
      let hasCollisions = false;

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < minSeparation) {
            hasCollisions = true;
            const force = (minSeparation - dist) / dist * 2; // Repulsion strength
            const fx = dx * force;
            const fy = dy * force;

            // Push labels apart
            positions[i].x += fx;
            positions[i].y += fy;
            positions[j].x -= fx;
            positions[j].y -= fy;

            // Keep labels within map bounds
            const margin = 50;
            positions[i].x = Math.max(margin, Math.min(scenario.mapDimensions.width - margin, positions[i].x));
            positions[i].y = Math.max(margin, Math.min(scenario.mapDimensions.height - margin, positions[i].y));
            positions[j].x = Math.max(margin, Math.min(scenario.mapDimensions.width - margin, positions[j].x));
            positions[j].y = Math.max(margin, Math.min(scenario.mapDimensions.height - margin, positions[j].y));
          }
        }
      }

      // Early exit if no collisions found
      if (!hasCollisions) break;
    }

    // Only render dynamic positioning on the client to avoid SSR/CSR mismatches
    if (!clientReady) return null;

    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        {positions.map(pos => (
           <div 
              key={pos.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
              style={{ left: pos.x, top: pos.y }}
              onMouseEnter={() => setHoveredRegion(pos.id)}
              onMouseLeave={() => setHoveredRegion(null)}
           >
              {/* Dot Anchor and Label Container */}
              <div className={`
                 transition-all duration-200 flex flex-col items-center
                 ${hoveredRegion === pos.id ? 'scale-110 z-50' : 'scale-100 opacity-80 hover:opacity-100'}
              `}>
                  <div className={`w-2 h-2 rounded-full mb-1 border shadow-sm transition-colors
                     ${hoveredRegion === pos.id ? 'bg-amber-600 border-white' : 'bg-amber-900/40 border-transparent'}
                  `} />
                  <span className={`
                     font-serif font-bold text-[10px] sm:text-xs tracking-widest uppercase px-2 py-1 rounded shadow-sm border transition-all
                     ${hoveredRegion === pos.id 
                        ? 'bg-amber-100 text-amber-900 border-amber-300' 
                        : 'bg-white/40 text-amber-900/80 border-transparent backdrop-blur-[2px]'}
                  `}>
                    {pos.name}
                  </span>
              </div>
           </div>
        ))}
      </div>
    );
  };

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

      <div 
        className="w-full h-full relative overflow-hidden bg-stone-100/50 touch-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      >
        <div 
          style={{ 
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: scenario.mapDimensions.width,
            height: scenario.mapDimensions.height,
            background: '#F3E5AB'
          }}
          className="relative transition-transform duration-75 ease-out will-change-transform shadow-2xl"
        >
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

          {/* Labels Layer */}
          {renderLabels()}

          <canvas
            ref={canvasRef}
            className="block"
            style={{
              imageRendering: "auto",
              width: "100%",
              height: "100%",
            }}
          />
        </div>
        
        {/* Zoom Controls */}
        <MapControls
          onZoomIn={() => setTransform(p => ({...p, scale: Math.min(4, p.scale + 0.2)}))}
          onZoomOut={() => setTransform(p => ({...p, scale: Math.max(0.25, p.scale - 0.2)}))}
          onResetView={() => setTransform({ x: 0, y: 0, scale: 1 })}
          scale={transform.scale}
        />
      </div>

      {/* Visual Action Legend Modal */}
      <MapLegendModal isOpen={showLegend} onClose={() => setShowLegend(false)} />

      <div className="absolute inset-0 pointer-events-none z-40 select-none">
        {/* Vignette Shadow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(60,40,20,0.3)_100%)]" />
        
        {/* Paper Grain (Optional, if not using canvas noise) */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]" />
        
        {/* Grid Lines Overlay (Optional stylistic choice) */}
        {visibleLayers.grid && (
           <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:100px_100px]" />
        )}
      </div>
    </motion.div>
  )

  // Helper inside component to get pixel from unit (since hexGrid is needed)
  function getUnitPixel(u: any) {
     if(!u.hex) return null;
     const key = `${u.hex.q},${u.hex.r}`;
     const hexData = scenario.hexIndex?.[key] ?? scenario.hexGrid?.find((h:any) => h.q === u.hex.q && h.r === u.hex.r);
     return hexData ? {x: hexData.x, y: hexData.y} : null;
  }
}

// Legend components are imported from components/map/MapLegend
