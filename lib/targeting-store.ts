import { create } from "zustand"
import type { CatalystOption, WarRoomScenario, AIGameResponse } from "./types"
import { SCENARIOS } from "./mock-scenario"

export type TargetingState = "idle" | "tactic_selected"

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

  // Actions
  selectTactic: (tactic: CatalystOption) => void
  reset: () => void
  incrementRound: () => void
  toggleLayer: (layer: keyof TargetingStore["visibleLayers"]) => void
  setScenario: (scenario: WarRoomScenario) => void
  setGameResponse: (response: AIGameResponse | null) => void
  setAnimating: (animating: boolean) => void
}

export const useTargetingStore = create<TargetingStore>((set, get) => ({
  state: "idle",
  selectedTactic: null,
  currentRound: 1,
  currentScenario: SCENARIOS.ww2_blitzkrieg,
  visibleLayers: {
    grid: true,
    units: true,
    terrain: true,
    regions: true,
  },
  gameResponse: null,
  isAnimating: false,

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

  setScenario: (scenario) =>
    set({
      currentScenario: scenario,
      currentRound: 1,
      selectedTactic: null,
      state: "idle",
    }),

  setGameResponse: (response) => set({ gameResponse: response }),

  setAnimating: (animating) => set({ isAnimating: animating }),
}))
