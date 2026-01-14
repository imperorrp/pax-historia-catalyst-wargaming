import { create } from "zustand"
import type { CatalystOption, WarRoomScenario, AIGameResponse, Unit } from "./types"
import { SCENARIOS } from "./mock-data/scenarios"
import { hydrateScenarioLayout } from "./grid-engine/layout-solver"
import { generatePaintedMap } from "./grid-engine/map-painter"

export type TargetingState = "idle" | "tactic_selected" | "unit_selected"

interface HistoryEntry {
  round: number
  scenario: WarRoomScenario
  narrative: string
  tacticUsed: CatalystOption | null
}

interface TargetingStore {
  state: TargetingState
  selectedTactic: CatalystOption | null
  selectedUnit: Unit | null
  currentRound: number
  currentScenario: WarRoomScenario
  visibleLayers: {
    grid: boolean
    units: boolean
    terrain: boolean
    regions: boolean
  }
  gameResponse: AIGameResponse | null
  isAnimating: boolean
  history: HistoryEntry[]
  historyIndex: number

  // Actions
  selectTactic: (tactic: CatalystOption) => void
  selectUnit: (unit: Unit | null) => void
  reset: () => void
  incrementRound: () => void
  toggleLayer: (layer: keyof TargetingStore["visibleLayers"]) => void
  setScenario: (scenario: WarRoomScenario) => void
  updateScenarioLayout: (scenario: WarRoomScenario) => void
  setGameResponse: (response: AIGameResponse | null) => void
  setAnimating: (animating: boolean) => void
  goToPreviousRound: () => void
  goToNextRound: () => void
  jumpToRound: (index: number) => void
  saveToHistory: (scenario: WarRoomScenario, narrative: string, tactic: CatalystOption | null) => void
}

// Hydrate initial scenario once
const initialScenario = hydrateScenarioLayout(SCENARIOS.ww2_blitzkrieg);

export const useTargetingStore = create<TargetingStore>((set, get) => ({
  state: "idle",
  selectedTactic: null,
  selectedUnit: null,
  currentRound: 1,
  currentScenario: initialScenario,
  visibleLayers: {
    grid: true,
    units: true,
    terrain: true,
    regions: true,
  },
  gameResponse: null,
  isAnimating: false,
  history: [{ round: 1, scenario: initialScenario, narrative: "Initial deployment", tacticUsed: null }],
  historyIndex: 0,

  selectTactic: (tactic) => {
    console.debug('[history] selectTactic called:', tactic?.id ?? null)
    set({
      selectedTactic: tactic,
      state: "tactic_selected",
    })
    // Update the current history entry to persist the selection
    const { history, historyIndex } = get()
    if (historyIndex >= 0 && historyIndex < history.length) {
      const newHistory = [...history]
      newHistory[historyIndex] = { ...newHistory[historyIndex], tacticUsed: tactic }
      console.debug('[history] selectTactic: updating historyIndex', historyIndex, 'with tactic', tactic?.id ?? null)
      set({ history: newHistory })
    }
  },

  selectUnit: (unit) =>
    set({
      selectedUnit: unit,
      state: unit ? "unit_selected" : "idle",
    }),

  reset: () =>
    set({
      state: "idle",
      selectedTactic: null,
      selectedUnit: null,
    }),

  incrementRound: () => set({ currentRound: get().currentRound + 1 }),

  toggleLayer: (layer) =>
    set({
      visibleLayers: {
        ...get().visibleLayers,
        [layer]: !get().visibleLayers[layer],
      },
    }),

  setScenario: (scenario) => {
    // If layout definitions exist, paint the map procedurally
    if (scenario.layoutDefs) {
       scenario.mapRegions = generatePaintedMap(
          scenario.layoutDefs, 
          scenario.mapDimensions.width, 
          scenario.mapDimensions.height
       );
    }
    
    // Hydrate scenario if it doesn't have hexGrid yet
    const hydratedScenario = scenario.hexGrid ? scenario : hydrateScenarioLayout(scenario);
    set({
      currentScenario: hydratedScenario,
      currentRound: 1,
      selectedTactic: null,
      state: "idle",
      history: [{ round: 1, scenario: hydratedScenario, narrative: "Initial deployment", tacticUsed: null }],
      historyIndex: 0,
    });
  },

  updateScenarioLayout: (scenario) => {
    // Update scenario geometry without resetting game state
    set({ currentScenario: scenario })
  },

  setGameResponse: (response) => set({ gameResponse: response }),

  setAnimating: (animating) => set({ isAnimating: animating }),

  saveToHistory: (scenario, narrative, tactic) => {
    console.debug('[history] saveToHistory called with tactic', tactic?.id ?? null)
    const { history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({
      round: newHistory.length + 1,
      scenario,
      narrative,
      tacticUsed: tactic,
    })
    console.debug('[history] saveToHistory: saved tactic', tactic?.id ?? null, 'at round', newHistory.length)
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },

  goToPreviousRound: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      const prevEntry = history[prevIndex]
      const isHistorical = prevIndex < history.length - 1
      console.debug('[history] goToPreviousRound -> prevIndex', prevIndex, 'isHistorical', isHistorical, 'tacticUsed', prevEntry.tacticUsed?.id ?? null)
      set({
        historyIndex: prevIndex,
        currentRound: prevEntry.round,
        currentScenario: hydrateScenarioLayout(prevEntry.scenario),
        selectedTactic: null, // selectedTactic is only for current round selections
        state: prevEntry.tacticUsed ? "tactic_selected" : "idle",
      })
    }
  },

  goToNextRound: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      const nextEntry = history[nextIndex]
      const isHistorical = nextIndex < history.length - 1
      console.debug('[history] goToNextRound -> nextIndex', nextIndex, 'isHistorical', isHistorical, 'tacticUsed', nextEntry.tacticUsed?.id ?? null)
      set({
        historyIndex: nextIndex,
        currentRound: nextEntry.round,
        currentScenario: hydrateScenarioLayout(nextEntry.scenario),
        selectedTactic: null, // selectedTactic is only for current round selections
        state: nextEntry.tacticUsed ? "tactic_selected" : "idle",
      })
    }
  },

  jumpToRound: (index) => {
    const { history } = get()
    if (index >= 0 && index < history.length) {
      const entry = history[index]
      const isHistorical = index < history.length - 1
      console.debug('[history] jumpToRound -> index', index, 'isHistorical', isHistorical, 'tacticUsed', entry.tacticUsed?.id ?? null)
      set({
        historyIndex: index,
        currentRound: entry.round,
        currentScenario: hydrateScenarioLayout(entry.scenario),
        selectedTactic: null, // selectedTactic is only for current round selections
        state: entry.tacticUsed ? "tactic_selected" : "idle",
      })
    }
  },
}))
