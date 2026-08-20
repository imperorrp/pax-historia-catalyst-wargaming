# Pax Historia Wargaming Prototype

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://pax-historia-wargaming-proto.vercel.app/)

## Overview

This is a prototype to test the feasibility of implementing an AI-driven visual combat resolver and wargaming feature for **Pax Historia**. It bridges the gap between text-based AI storytelling and visual strategy games by generating visual battlefield representations ("scenarios") from textual semantic descriptions.

**Live Demo:** [pax-historia-wargaming-proto.vercel.app](https://pax-historia-wargaming-proto.vercel.app/)

---

## Why Implement This?
- **Strategy Game Audiences:** Alternate history and strategy game enthusiasts love wargaming, making it a highly requested feature within the Pax Historia community.
- **Enhanced Scope & Roleplay:** Adds depth by letting players zoom in and experience specific battles/wars on a tactical level, rather than viewing everything from a persistent top-down world map.
- **Multiplayer Resolution:** A fun, engaging way of settling conflicts and battles in multiplayer gameplay by incorporating strategic war logic alongside Pax Historia's prompt-based AI.

---

## Feature Concept
The core idea is to reverse-generate visual battlefield representations ("scenarios") from AI-generated textual semantic descriptions.

- **AI Prompts:** Instruct the AI to create structured textual semantic representations of battlefield states (regions, terrain, units, tags) and possible strategic moves in a prescribed format (JSON).
- **Visual Engine:** A client-side rendering engine takes the semantic information and paints rough graphical maps. Because combat maps are temporary, precision is less critical compared to the persistent world map.
- **Turn Referee:** Each scenario contains multiple tactical options for players. Selecting an option causes the scenario to evolve.

### AI Call Types
1. **Scenario Generator:** Consumes/generates 2000–5000 total tokens. Creates rough regions, units, terrains, placements, and player choices.
2. **Turn Referee:** Consumes/generates 2000–5000 total tokens. Evaluates current scenario state and player choices, resolves outcomes, and creates the next set of choices.

---

## How The Prototype Works
- **Map Generation:** AI defines abstract shapes ("blobs" or "paths") with influence radii and terrain types instead of precise coordinates. The client-side engine (using `d3-delaunay` for Voronoi diagram hex-grids and `roughjs` for sketching) paints them.
- **Semantic Positioning:** Units are positioned using semantic tags (`front_line`, `center`, `flank_left`) relative to a `regionId` rather than hard x/y pixels. The geometry solver calculates the centroid and places the unit in the appropriate hex automatically. Tags also act as status modifiers (`dug_in`, `routing`, `engaged`) represented visually.
- **Visual Actions and Visual Effects:** Player tactical options map to visual library keywords (`ENCIRCLE`, `SPEARHEAD`, `INFILTRATE`). Hovering over an option renders bezier curves or lines. Visual effects (such as `EXPLOSION` on a target `unit_id`) are transient animations depicting outcomes.
- **AI vs Mock Mode:**
  - **Mock Mode:** Skips API calls and loads pre-scripted JSON payloads for demo/preview purposes.
  - **AI Mode:** Sends the current state to the LLM (GPT-4o/Gemini) which resolves the setup and turn outcome.

---

## Project Structure & Architecture

The project is structured to mimic an AI tool-call response flow natively in React. The codebase comprises the following core logic and UI blocks:

### Core Logic (`/lib`)
Contains the "Brain" of the prototype—handling state, rendering logic, and mock AI responses.
- **`targeting-store.ts`**: Zustand state machine managing the global state (`idle`, `tactic_selected`, `unit_selected`), visible layers, and animation flags.
- **`game-loop.ts`**: Handles state reconciliation. `getInitialPayload()` mocks the AI generation step. `reconcileStateChanges()` applies AI instructions to update unit coordinates, tags, or removes units.
- **`visual-action-library.ts`**: HTML5 Canvas rendering logic to draw specific tactical moves (e.g., `FLANK_LEFT`, `BOMBARD`) using arrows, dashed lines, and NATO symbols based on the selected tactic's semantic type.
- **`geometry-utils.ts`**: Mathematical helpers for point hit-testing (`isPointInPolygon`), geometry centroids, distance calculation, and culling the map to a "Theater of Operations".
- **`hex-grid-manager.ts` & `terrain-manager.ts`**: Dedicated engines for handling the Voronoi/hex-grid mappings and terrain rules.
- **`mock-data/` & `types.ts`**: Hardcoded game states (WW2 Blitzkrieg, Napoleonic Austerlitz, Medieval Siege) and TypeScript interfaces for Units, MapRegions, and AIGameResponses.

### Components (`/components`)
- **`war-room-map.tsx`**: The main Canvas component. Responsible for clearing the canvas and rendering the paper texture background, map polygons, units, and ghost arrow visual actions.
- **`war-room-layout.tsx`**: The container shell organizing the Dispatch Log, Main Map, and Unit Status. Handles the "Commit" logic flow.
- **`unit-counter.tsx`**: Renders units as HTML/Div overlays via Framer Motion, enabling interactive hover states and fluid animations independent of the canvas redraw cycle. Implements the "NATO Symbol" logic.
- **`catalyst-card.tsx`**: Interactive option cards that trigger `tactic_selected` states and map previews.
- **`debug-panel.tsx` & `create-scenario-modal.tsx`**: Tools for developers to inject JSON or modify states directly.

---

## Key Logic Flows

1. **The "Preview" Loop:**
   - User hovers a `CatalystCard` (e.g., "Flank Left").
   - `targeting-store` updates the `selectedTactic`.
   - `war-room-map.tsx` detects the selection, filters relevant units (e.g., Player Armor vs Enemy Infantry), and calls the renderer (`renderVisualAction('FLANK_LEFT')`).
   - `visual-action-library` calculates a Bezier curve and draws the action ghost arrow on the canvas.

2. **The "Execution" Loop:**
   - User clicks "Confirm & Advance".
   - `war-room-layout` fetches the AI result (or mock result) via `getInitialPayload`.
   - The Dispatch Log updates with the "Narrative Update".
   - `reconcileStateChanges` processes new coordinates for tagged units.
   - `targeting-store` propagates the updated `currentScenario`, triggering Framer Motion to smoothly transition `Unit Counters` to their new positions.

---

## Supported Visual Actions & Effects

When the AI generates a "Catalyst Option" (a tactical maneuver), it assigns that option a semantic **Visual Action Type**. The rendering engine (`lib/visual-action-library.ts`) intercepts this type and draws the corresponding hand-sketched overlay onto the HTML5 Canvas to preview the move before the user commits.

The engine currently supports a wide array of maneuvers across different eras and domains:

### Land & General Maneuvers
- **`ADVANCE` / `ASSAULT`**: Solid, bold arrows with shadows indicating direct movement or attack.
- **`FLANK_LEFT` / `FLANK_RIGHT`**: Bezier-curved arrows wrapping around the sides.
- **`ENCIRCLE`**: Pincer-like dual curved arrows moving to surround a target.
- **`INFILTRATE`**: Serpentine, dashed lines indicating stealth movement.
- **`RETREAT`**: Dashed arrows pointing backwards.
- **`TRAMPLE`**: A blunt, extremely thick arrow with shockwave markers.
- **`COMBINED_ASSAULT` & `MANEUVER`**: Complex paths combining multiple vectors.

### Defensive & Positional
- **`FORTIFY`**: A large, defensive sawtooth barrier drawn around the unit's position.
- **`HOLD`**: A large glowing shield/ring emblem anchoring a unit in place.
- **`AMBUSH`**: A mysterious `?` icon indicating hidden forces waiting to strike.

### Ranged & Support
- **`BOMBARD`**: A harsh starburst blast radius representing artillery fire.
- **`SUPPRESS`**: A semi-transparent gradient cone of fire with impact dots.
- **`AIRSTRIKE`**: A flight path silhouette culminating in a large explosion.
- **`RECON`**: Concentric radar/sonar rings emanating toward a target area.
- **`RAIN_ARROWS`**: Multiple high, arcing bezier curves representing volleys of arrows.

### Naval Operations
- **`FIRE_SHIP`**: A wide, orange-red gradient path indicating a burning vessel being sent forward.
- **`NAVAL_RAM`**: A heavy, solid line ending in concentric impact ripples.
- **`BROADSIDES` / `RAKING_FIRE` / `BOARDING` / `LINE_OF_BATTLE`**: Specialized ship-to-ship tactical visualizations.

### Cyber Warfare
- **`HACK`**: A jagged, "Matrix green" digital line with binary bits (`101101`) flowing along the path.

### Transient Visual Effects
When a turn is actually executed, the engine plays brief transient animations on the target units to represent outcomes:
- **`EXPLOSION`**, **`FIRE`**, **`SMOKE`**, **`DUST`**, **`IMPACT`**, **`MUD_SPLAT`**

---

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS + Shadcn UI (Radix Primitives)
- **Animations:** Framer Motion
- **Canvas Rendering:** HTML5 Canvas + Rough.js (for the hand-drawn map aesthetic) + d3-delaunay (Hex-grids and Voronoi generation)
- **State Management:** Zustand
- **Icons:** Lucide-React
- **Validation:** Zod

---

## Getting Started

First, install the dependencies using `pnpm`:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Configuration (For AI Mode)
While the prototype defaults to using mock payloads for immediate preview, it also includes full API endpoints to connect to live LLMs.

To enable the true AI Mode (calling the `generate-scenario` and `resolve-turn` endpoints), create a `.env.local` file at the root of your project and add your preferred provider's API key:

```env
# Choose your preferred provider
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
```

### Testing
This project uses Vitest for unit testing. You can run the test suite with:

```bash
pnpm test
# Or run with the Vitest UI
pnpm test:ui
```

---

## Future Roadmap
Because this is currently a **prototype**, there are several key milestones planned before it merges into the main Pax Historia client:
1. **WebSockets Integration:** Transitioning the Turn Referee from REST API calls to real-time WebSockets to support synchronous multiplayer conflict resolution.
2. **Persistent World Connection:** Letting the overarching world map seed the initial `generate-scenario` context (i.e. if the battle is in a desert, the terrain hexes should automatically bias towards sand/dunes).
3. **Refining the Prompts:** The AI `prompt-builder` currently hallucinates specific NATO markers occasionally; strict JSON grammar forcing needs optimization.
