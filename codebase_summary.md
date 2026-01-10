Codebase Summary: Visual Catalyst Prototype
1. Project Overview
This project is a Next.js (App Router) prototype for a "War Room" strategy interface designed for the text-based RPG Pax Historia. It bridges the gap between text-based AI storytelling and visual strategy games (like Hearts of Iron) using React, Zustand for state management, and Rough.js for a hand-drawn map aesthetic.
Core Concept:
Users select a "Catalyst Option" (AI-generated tactical plan).
The map visualizes this plan with ghost arrows/markers.
Upon commitment, the system "simulates" the round, updating unit positions via a state reconciliation logic that mimics an AI tool-call response.
2. Tech Stack
Framework: Next.js 16 (App Router)
Styling: Tailwind CSS + Shadcn UI (Radix Primitives)
Animations: Framer Motion (for UI layout shifts)
Canvas Rendering: HTML5 Canvas + roughjs (for sketched map features)
State Management: Zustand
Icons: Lucide-React
3. Directory Logic & Key Files
A. Core Logic (/lib)
This folder contains the "Brain" of the prototype—the logic that replaces the actual AI backend for this demo.
targeting-store.ts (The State Machine):
Uses Zustand to manage the global state (idle, tactic_selected, unit_selected).
Tracks the currentScenario, currentRound, visibleLayers, and isAnimating flags.
Key Action: selectTactic(option) triggers the UI to enter "Preview Mode."
game-loop.ts (The AI Simulation):
getInitialPayload(tacticId): Mocks the AI generation step. It looks up a pre-written JSON response (from ai-payloads.ts) based on what card the user clicked.
reconcileStateChanges(scenario, response): The critical logic that applies the "AI's" instructions to the current game state. It handles MOVE (updating coordinates), UPDATE_STATUS (changing tags), and REMOVE.
visual-action-library.ts (The Renderer):
Contains the drawing logic for specific tactical moves (e.g., drawFLANK_LEFT, drawBOMBARD).
Uses HTML5 Canvas Context (ctx) to draw arrows, dashed lines, and NATO symbols based on the selected tactic's semantic type.
geometry-utils.ts:
Helper functions for math: isPointInPolygon (hit testing), getPolygonCentroid (placing units), getDistance, and logic to determine "Theater of Operations" (culling the map).
mock-scenario.ts:
Contains the hardcoded game states (ww2_blitzkrieg, napoleonic_austerlitz, medieval_siege).
Defines Map Polygons (SVG path points), Units, and Catalyst Options.
B. Components (/components)
The UI building blocks.
war-room-map.tsx (The Canvas):
The most complex component. It creates an HTML Canvas.
Rendering Loop: It clears the canvas, draws the background (Paper texture), draws the regions (Polygons), draws the Units, and finally draws the Visual Actions (Ghost Arrows) if a tactic is selected.
Uses roughjs logic (simulated in standard Canvas API for now) to achieve the aesthetic.
war-room-layout.tsx (The Container):
The main layout shell. Handles the "Dispatch Log" (Left), the "Main Map" (Center), and the "Unit Status" (Right).
Orchestrates the "Commit" flow: clicking the button triggers the state update and animation sequence.
unit-counter.tsx:
Renders units as HTML/Div overlays on top of the canvas. This allows them to be interactive (hover states, clicking) and animated via Framer Motion independent of the canvas redraw cycle.
Implements the "NATO Symbol" logic based on unit type.
catalyst-card.tsx:
The interactive option cards at the bottom.
Hovering these triggers the state: tactic_selected in the store, causing the map to render the ghost arrows.
C. Types (/lib/types.ts)
Defines the contract between the Frontend and the (Mock) AI.
Unit: Location, tags, owner.
MapRegion: Points (geometry), terrain type.
AIGameResponse: The structure expected from the AI tool call (narrative + state_changes).
4. Key Logic Flows
1. The "Preview" Loop:
User hovers CatalystCard (e.g., "Flank Left").
targeting-store updates selectedTactic.
war-room-map.tsx detects selectedTactic.
Inside the render loop, it finds the relevant units (Player Armor vs Enemy Infantry).
It calls renderVisualAction('FLANK_LEFT').
visual-action-library calculates a Bezier curve and draws the arrow.
2. The "Execution" Loop:
User clicks "Confirm & Advance".
war-room-layout calls getInitialPayload to fetch the Mock AI Result.
Logs update with the "Narrative Update".
reconcileStateChanges calculates new X/Y coordinates for units tagged with MOVE.
targeting-store updates the currentScenario with the new unit positions.
React/Framer Motion detects the prop change and smoothly animates the Unit Counters to their new positions.
5. Visual Style Definition (globals.css)
Colors: Defines a palette of "Amber/Parchment" colors (#F3E5AB, #2c3e50) to enforce the "Commander's Table" aesthetic.
Fonts: Uses Libre Baskerville (Serif) for headings and IBM Plex Mono for logs to mix "Old World" authority with "Modern Intel".