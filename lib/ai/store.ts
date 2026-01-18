import { create } from 'zustand';

interface AIState {
  isMockMode: boolean;
  isDebugOpen: boolean;
  
  // Last Execution State - Scenarios
  lastScenarioPrompt: string;
  lastScenarioSystemPrompt: string;
  lastScenarioResponse: any;

  // Last Execution State - Turns
  lastTurnPrompt: string;
  lastTurnSystemPrompt: string;
  lastTurnResponse: any;

  // General legacy getters (can be deprecated or aliased to Turn)
  lastPrompt: string;
  lastSystemPrompt: string;
  lastResponse: any;

  isLoading: boolean;
  
  // Configuration
  provider: 'openai' | 'google';
  openaiKey: string;
  googleKey: string;
  selectedModel: string;
  
  // User Configurable Prompts
  scenarioSystemPrompt: string;
  turnSystemPrompt: string;

  // Validation
  isValidating: boolean;
  isKeyValid: boolean;
  validationMessage: string;

  // Actions
  toggleMockMode: () => void;
  toggleDebug: () => void;
  setScenarioTransaction: (prompt: string, systemPrompt: string, response: any) => void;
  setTurnTransaction: (prompt: string, systemPrompt: string, response: any) => void;
  setTransaction: (prompt: string, systemPrompt: string, response: any) => void; // Legacy alias to Turn
  setLoading: (loading: boolean) => void;
  setConfig: (config: Partial<AIState>) => void;
  validateKey: () => Promise<void>;
  
  // Helpers
  hasValidKey: () => boolean;
}

export const useAIStore = create<AIState>((set, get) => ({
  isMockMode: true,
  isDebugOpen: false,
  
  lastScenarioPrompt: "Waiting for scenario request...",
  lastScenarioSystemPrompt: "No system instructions recorded.",
  lastScenarioResponse: {},

  lastTurnPrompt: "Waiting for turn resolution...",
  lastTurnSystemPrompt: "No system instructions recorded.",
  lastTurnResponse: {},

  // Legacy mappings to Turn (most common action)
  get lastPrompt() { return get().lastTurnPrompt },
  get lastSystemPrompt() { return get().lastTurnSystemPrompt },
  get lastResponse() { return get().lastTurnResponse },

  isLoading: false,

  // Defaults
  provider: 'openai',
  openaiKey: '',
  googleKey: '',
  selectedModel: 'gpt-4o',
  
  scenarioSystemPrompt: `You are the Game Master for "Pax Historia", a tactical war game.
Your job is to generate a balanced, historically plausible battlefield scenario.
Ensure the layout makes tactical sense (e.g., defenders on hills, rivers blocking paths).`,

  turnSystemPrompt: `You are a tactical wargame referee engine. Your goal is to resolve turn-based combat with dramatic flair and tactical realism. 
Maintain a consistent JSON output format as specified in the schema. 
Be creative with "visual_actions" to describe the flow of battle.`,

  isValidating: false,
  isKeyValid: false,
  validationMessage: '',

  toggleMockMode: () => set((state) => ({ isMockMode: !state.isMockMode })),
  toggleDebug: () => set((state) => ({ isDebugOpen: !state.isDebugOpen })),
  
  setScenarioTransaction: (prompt, systemPrompt, response) => set({ 
      lastScenarioPrompt: prompt, 
      lastScenarioSystemPrompt: systemPrompt, 
      lastScenarioResponse: response 
  }),

  setTurnTransaction: (prompt, systemPrompt, response) => set({ 
      lastTurnPrompt: prompt, 
      lastTurnSystemPrompt: systemPrompt, 
      lastTurnResponse: response 
  }),

  setTransaction: (prompt, systemPrompt, response) => set({ 
      lastTurnPrompt: prompt, 
      lastTurnSystemPrompt: systemPrompt, 
      lastTurnResponse: response 
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),

  setConfig: (config) => {
      set((state) => ({ ...state, ...config, isKeyValid: false })); 
  },

  validateKey: async (skipVerification = false, selectedModel?: string) => {
    const { provider, openaiKey, googleKey } = get();
    const apiKey = provider === 'openai' ? openaiKey : googleKey;
    
    if (!apiKey || apiKey.length < 5) {
        set({ isKeyValid: false, validationMessage: 'Key too short' });
        return;
    }

    set({ isValidating: true, validationMessage: '' });
    
    try {
        const res = await fetch('/api/verify-key', {
          method: 'POST',
          body: JSON.stringify({ provider, apiKey, skipVerification, selectedModel }),
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await res.json();
        set({ isValidating: false, isKeyValid: data.isValid, validationMessage: data.message });
    } catch (e) {
        set({ isValidating: false, isKeyValid: false, validationMessage: 'Network error checking key' });
    }
  },

  hasValidKey: () => {
    return get().isKeyValid; 
  },
}));
