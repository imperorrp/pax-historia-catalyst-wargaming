import { create } from "zustand"
import type { CatalystOption, WarRoomScenario, AIGameResponse } from "./types"
import { SCENARIOS } from "./mock-scenario"
import { hydrateScenarioLayout } from "./grid-engine/layout-solver"

export type TargetingState = "idle" | "tactic_selected"

interface HistoryEntry {
  round: number
  scenario: WarRoomScenario
  narrative: string
  tacticUsed: CatalystOption | null
}

interface TargetingStore {
  state: TargetingState
  selectedTactic: CatalystOption | null
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

  selectTactic: (tactic) =>
    set({
      selectedTactic: tactic,
      state: "tactic_selected",
    }),

  reset: () =>
    set({
      state: "idle",
      selectedTactic: null,
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
    const { history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({
      round: newHistory.length + 1,
      scenario,
      narrative,
      tacticUsed: tactic,
    })
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },

  goToPreviousRound: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      const prevEntry = history[prevIndex]
      set({
        historyIndex: prevIndex,
        currentRound: prevEntry.round,
        currentScenario: prevEntry.scenario,
        selectedTactic: null,
        state: "idle",
      })
    }
  },

  goToNextRound: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      const nextEntry = history[nextIndex]
      set({
        historyIndex: nextIndex,
        currentRound: nextEntry.round,
        currentScenario: nextEntry.scenario,
        selectedTactic: null,
        state: "idle",
      })
    }
  },

  jumpToRound: (index) => {
    const { history } = get()
    if (index >= 0 && index < history.length) {
      const entry = history[index]
      set({
        historyIndex: index,
        currentRound: entry.round,
        currentScenario: entry.scenario,
        selectedTactic: null,
        state: "idle",
      })
    }
  },
}))
