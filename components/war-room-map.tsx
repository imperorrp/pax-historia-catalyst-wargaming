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

// Helper Functions for Scatter Props and Rivers
function getBoundingBox(points: [number, number][]): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  points.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  return { minX, maxX, minY, maxY };
}

function isPointInPolygon(point: { x: number; y: number }, polygon: [number, number][]): boolean {
  const { x, y } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function drawScatterProps(rc: any, points: [number, number][], terrain: string) {
  const bounds = getBoundingBox(points);
  const area = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
  const density = 0.0003; // Adjust based on visual density
  const count = Math.floor(area * density);

  for (let i = 0; i < count; i++) {
    const rx = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
    const ry = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);

    // Check if random point is actually inside the region
    if (isPointInPolygon({ x: rx, y: ry }, points)) {
      if (terrain === 'forest') {
        // Draw stylized pine tree
        rc.line(rx, ry, rx - 3, ry + 8, { stroke: '#2e7d32', strokeWidth: 1 });
        rc.line(rx, ry, rx + 3, ry + 8, { stroke: '#2e7d32', strokeWidth: 1 });
        rc.line(rx - 3, ry + 8, rx + 3, ry + 8, { stroke: '#2e7d32', strokeWidth: 1 });
      } else if (terrain === 'mountain') {
        // Draw mountain peak
        rc.path(`M ${rx} ${ry} L ${rx + 8} ${ry - 12} L ${rx + 16} ${ry}`, { stroke: '#5d4037', strokeWidth: 1 });
      } else if (terrain === 'river' || terrain === 'water') {
        // Draw water ripples
        rc.curve([[rx, ry], [rx + 3, ry + 1], [rx + 6, ry]], { stroke: '#2980b9', strokeWidth: 0.5 });
      } else if (terrain === 'swamp' || terrain === 'mud') {
        // Draw mud splatters
        rc.circle(rx, ry, 2 + Math.random() * 3, { fill: '#3e2723', fillStyle: 'solid', roughness: 2 });
      }
    }
  }
}

function drawRiver(rc: any, regions: any[], river: any) {
  // Find shared edges between regions in the river path
  const riverSegments: [number, number][][] = [];

  for (let i = 0; i < river.pathNodes.length - 1; i++) {
    const regionA = regions.find(r => r.id === river.pathNodes[i]);
    const regionB = regions.find(r => r.id === river.pathNodes[i + 1]);

    if (regionA && regionB) {
      // Find shared edges (simplified - in practice you'd need proper edge detection)
      const sharedEdges = findSharedEdges(regionA.points, regionB.points);
      if (sharedEdges.length > 0) {
        riverSegments.push(...sharedEdges);
      }
    }
  }

  // Draw river segments
  riverSegments.forEach(segment => {
    if (segment.length >= 2) {
      rc.path(`M ${segment[0][0]} ${segment[0][1]} L ${segment[1][0]} ${segment[1][1]}`, {
        stroke: '#2980b9',
        strokeWidth: river.width || 6,
        roughness: 1
      });
    }
  });
}

function findSharedEdges(pointsA: [number, number][], pointsB: [number, number][]): [number, number][][] {
  // Simplified edge sharing detection - in a full implementation you'd use proper geometric algorithms
  // For now, return a sample edge for demonstration
  const boundsA = getBoundingBox(pointsA);
  const boundsB = getBoundingBox(pointsB);

  // Find approximate shared boundary
  const sharedX = Math.max(boundsA.minX, boundsB.minX) + (Math.min(boundsA.maxX, boundsB.maxX) - Math.max(boundsA.minX, boundsB.minX)) / 2;
  const startY = Math.max(boundsA.minY, boundsB.minY);
  const endY = Math.min(boundsA.maxY, boundsB.maxY);

  if (startY < endY) {
    return [[[sharedX, startY], [sharedX, endY]]];
  }

  return [];
}

export function WarRoomMap({ scenario }: WarRoomMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRendered, setIsRendered] = useState(false)
  const selectedTactic = useTargetingStore((s) => s.selectedTactic)
  const visibleLayers = useTargetingStore((s) => s.visibleLayers)
  const debugMode = useTargetingStore((s) => s.debugMode)
  const history = useTargetingStore((s) => s.history)
  const historyIndex = useTargetingStore((s) => s.historyIndex)
  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null); // NEW STATE

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
            : [{ semanticAction: tactic.semanticAction, targetLogic: tactic.targetLogic, targetRegionId: tactic.targetRegionId }]

          actionsToRender.forEach((action) => {
            if (action.requiredUnitTypes && !action.requiredUnitTypes.includes(playerUnit.type)) {
              // Not an issue—just not applicable to this unit
              return;
            }

            // Resolve target loc using the same logic as render loop
            let targetLoc: {x:number,y:number} | null = null
            switch(action.targetLogic) {
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
    e.stopPropagation();
    const scaleSensitivity = 0.001
    const newScale = Math.min(Math.max(0.5, transform.scale - e.deltaY * scaleSensitivity), 4)
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
    e.preventDefault()
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
    e.preventDefault()
    
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
      const newScale = Math.min(Math.max(0.5, transform.scale + delta * scaleSensitivity), 4)
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

        switch (region.terrain) {
          case 'river':
            // More distinct Blue, less scratchy
            fill = isHovered ? "rgba(33, 150, 243, 0.6)" : "rgba(33, 150, 243, 0.4)"; 
            stroke = "rgba(33, 150, 243, 0.3)"; // Faint blue border
            fillStyle = "solid"; // Solid water looks better than scratchy zigzag
            roughness = 0.5; // Smooth water
            bowing = 0.2;
            break;
          case 'forest':
            fill = isHovered ? "rgba(56, 142, 60, 0.35)" : "rgba(56, 142, 60, 0.25)";
            stroke = "#2e7d32";
            fillStyle = "cross-hatch";
            roughness = 1.2;
            break;
          case 'mountain':
            fill = isHovered ? "rgba(117, 117, 117, 0.4)" : "rgba(117, 117, 117, 0.3)";
            stroke = "#424242";
            fillStyle = "hachure";
            roughness = 1.5;
            break;
          case 'swamp':
          case 'mud':
            fill = isHovered ? "rgba(101, 67, 33, 0.45)" : "rgba(78, 52, 46, 0.35)";
            stroke = "#3e2723";
            fillStyle = "dots"; // Muddy texture
            break;
          case 'urban':
            fill = isHovered ? "rgba(100, 100, 100, 0.35)" : "rgba(100, 100, 100, 0.25)";
            stroke = "#000";
            fillStyle = "solid";
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

    if (tacticToDisplay && visibleLayers.units) {
      const playerUnits = scenario.units.filter((u) => u.owner === "player")
      const enemyUnits = scenario.units.filter((u) => u.owner === "enemy")

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
          : [{ semanticAction: tacticToDisplay.semanticAction, targetLogic: tacticToDisplay.targetLogic, targetRegionId: tacticToDisplay.targetRegionId }]

        playerUnits.forEach((playerUnit) => {
          actionsToRender.forEach((action, actionIndex) => {
            // Check if this unit type is relevant for the action
            if (action.requiredUnitTypes && !action.requiredUnitTypes.includes(playerUnit.type)) {
               console.warn(`[render] Skip action ${action.semanticAction} for unit ${playerUnit.id} due to unit type mismatch (required: ${action.requiredUnitTypes.join(',')}, unit: ${playerUnit.type})`);
               return; 
            }

            const fromLoc = getUnitPixel(playerUnit);
            if (!fromLoc) {
              console.warn(`[render] Unit ${playerUnit.id} has no pixel (hex missing), skipping action ${action.semanticAction}`);
              return;
            }

            let targetLoc = null;

            // --- SMART TARGETING LOGIC ---
            switch(action.targetLogic) {
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
              
              const drawn = renderVisualAction(action.semanticAction as any, {
                ctx,
                from: fromLoc,
                to: targetLoc,
                opacity: opacity,
              });

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
  }, [scenario.id, scenario.hexGrid, scenario.units, selectedTactic, visibleLayers, hoveredRegion, debugMode]) // Fixed dep array to prevent rerenders

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
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-white/80 backdrop-blur rounded-lg shadow border border-stone-200 p-1">
          <button 
            onClick={() => setTransform(p => ({...p, scale: Math.min(4, p.scale + 0.2)}))}
            className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded text-stone-700 font-bold"
          >+</button>
          <div className="text-xs text-center text-stone-400 font-mono">{Math.round(transform.scale * 100)}%</div>
          <button 
            onClick={() => setTransform(p => ({...p, scale: Math.max(0.5, p.scale - 0.2)}))}
            className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded text-stone-700 font-bold"
          >-</button>
          <button 
             onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
             className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded text-stone-700 font-bold text-xs"
             title="Reset View"
          >R</button>
        </div>
      </div>

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

                {/* Dev: Debug Actions Button & Report */}
                <div className="mt-4">
                  <button className="px-3 py-2 bg-amber-900 text-white rounded" onClick={() => analyzeActions()}>
                    Debug Actions
                  </button>
                  {debugReport && debugReport.length > 0 && (
                    <div className="mt-3 p-2 bg-white/80 rounded border">
                      <div className="font-bold text-sm mb-2">Debug Report (first 10 issues)</div>
                      <ul className="text-xs list-disc pl-4" style={{ maxHeight: 180, overflow: 'auto' }}>
                        {debugReport.slice(0,10).map((r, i) => (
                          <li key={i}><strong>{r.severity}:</strong> {r.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
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
