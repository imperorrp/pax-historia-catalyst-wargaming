import { create } from 'zustand';
import { SCENARIO_BASE_INSTRUCTIONS, TURN_BASE_INSTRUCTIONS } from './system-instructions';

// Define the shape of a single AI interaction
export interface AITransaction {
  id: string;
  timestamp: number;
  type: 'SCENARIO_GEN' | 'TURN_RES' | 'KEY_VALIDATION';
  status: 'pending' | 'success' | 'error';
  model: string;
  provider: string;
  
  // Data
  systemPrompt?: string;
  userPrompt?: string;
  rawResponse?: any;
  error?: string;
  latency?: number; // ms
  
  // New Telemetry
  rawOutput?: string; 
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface AIState {
  isMockMode: boolean;
  isDebugOpen: boolean;
  
  // Configuration
  provider: 'openai' | 'google';
  openaiKey: string;
  googleKey: string;
  selectedModel: string;
  
  // Prompt overrides
  scenarioSystemPrompt: string;
  turnSystemPrompt: string;

  // Prompt tracking (for Debug Panel)
  lastScenarioPrompt: string | null;
  lastScenarioSystemPrompt: string | null;
  lastTurnPrompt: string | null;
  lastTurnSystemPrompt: string | null;

  // Telemetry
  history: AITransaction[];
  isLoading: boolean;
  isKeyValid: boolean;
  validationMessage: string;

  // Actions
  toggleMockMode: () => void;
  toggleDebug: () => void;
  
  // Logging actions
  startTransaction: (type: AITransaction['type'], userPrompt?: string) => string; // Returns ID
  completeTransaction: (id: string, response: any) => void;
  failTransaction: (id: string, error: string, rawResponse?: any, usage?: any) => void;
  
  setConfig: (config: Partial<AIState>) => void;
  setLastPrompts: (type: 'SCENARIO' | 'TURN', userPrompt: string, systemPrompt: string) => void;
  setMockPrompt: (type: 'SCENARIO' | 'TURN') => void;
  validateKey: () => Promise<void>;
  hasValidKey: () => boolean;
  clearHistory: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  isMockMode: true, // Default to mock for safety
  isDebugOpen: false,
  
  provider: 'openai',
  openaiKey: '',
  googleKey: '',
  selectedModel: 'gpt-4o',
  
  scenarioSystemPrompt: SCENARIO_BASE_INSTRUCTIONS, 
  turnSystemPrompt: TURN_BASE_INSTRUCTIONS, 

  lastScenarioPrompt: null,
  lastScenarioSystemPrompt: null,
  lastTurnPrompt: null,
  lastTurnSystemPrompt: null,

  history: [],
  isLoading: false,
  isKeyValid: false,
  validationMessage: '',

  toggleMockMode: () => set((state) => ({ isMockMode: !state.isMockMode })),
  toggleDebug: () => set((state) => ({ isDebugOpen: !state.isDebugOpen })),

  setLastPrompts: (type, userPrompt, systemPrompt) => {
    if (type === 'SCENARIO') {
      set({ lastScenarioPrompt: userPrompt, lastScenarioSystemPrompt: systemPrompt });
    } else {
      set({ lastTurnPrompt: userPrompt, lastTurnSystemPrompt: systemPrompt });
    }
  },

  setMockPrompt: (type) => {
    const mockMsg = "/// MOCK MODE ACTIVE ///\nNo LLM API call was made.\nData was retrieved from pre-scripted local files.";
    if (type === 'SCENARIO') {
      set({ lastScenarioPrompt: mockMsg, lastScenarioSystemPrompt: mockMsg });
    } else {
      set({ lastTurnPrompt: mockMsg, lastTurnSystemPrompt: mockMsg });
    }
  },

  setConfig: (config) => set((state) => {
    const updates: any = { ...config, isKeyValid: false };

    // Auto-switch model if provider changes
    if (config.provider && config.provider !== state.provider) {
      if (config.provider === 'google') {
        updates.selectedModel = 'gemini-1.5-flash';
      } else {
        updates.selectedModel = 'gpt-4o';
      }
    }

    return { ...state, ...updates };
  }),

  startTransaction: (type, userPrompt) => {
    const id = crypto.randomUUID();
    const { provider, selectedModel, scenarioSystemPrompt, turnSystemPrompt } = get();
    
    // Determine which valid system prompt to use
    let relevantSystemPrompt = '';
    if (type === 'SCENARIO_GEN') relevantSystemPrompt = scenarioSystemPrompt;
    if (type === 'TURN_RES') relevantSystemPrompt = turnSystemPrompt;

    const newEntry: AITransaction = {
      id,
      timestamp: Date.now(),
      type,
      status: 'pending',
      model: selectedModel,
      provider,
      systemPrompt: relevantSystemPrompt,
      userPrompt: userPrompt,
    };

    set(state => ({ 
      history: [newEntry, ...state.history],
      isLoading: true 
    }));
    return id;
  },

  completeTransaction: (id, responseWrapper: any) => {
    set(state => ({
      isLoading: false,
      history: state.history.map(entry => {
        if (entry.id !== id) return entry;
        
        // Handle both old style (direct payload) and new style (wrapped)
        const isWrapped = responseWrapper && (responseWrapper.data || responseWrapper.raw || responseWrapper.usage);
        
        // Normalize usage shape to consistent camelCase token fields
        const normalizeUsage = (u: any) => {
          if (!u) return undefined;
          const promptTokens = u.promptTokens ?? u.prompt_tokens ?? u.input_tokens ?? u.prompt ?? undefined;
          const completionTokens = u.completionTokens ?? u.completion_tokens ?? u.output_tokens ?? u.completion ?? undefined;
          const totalTokens = u.totalTokens ?? u.total_tokens ?? u.total ?? (typeof promptTokens === 'number' && typeof completionTokens === 'number' ? promptTokens + completionTokens : u.total ?? undefined);
          return { promptTokens, completionTokens, totalTokens };
        };

        return {
          ...entry,
          status: 'success',
          rawResponse: isWrapped ? responseWrapper.data : responseWrapper,
          rawOutput: isWrapped ? responseWrapper.raw : undefined,
          tokenUsage: isWrapped ? normalizeUsage(responseWrapper.usage) : undefined,
          latency: Date.now() - entry.timestamp
        };
      })
    }));
  },

  failTransaction: (id, error, rawResponse, usage) => {
    const normalizeUsage = (u: any) => {
      if (!u) return undefined;
      const promptTokens = u.promptTokens ?? u.prompt_tokens ?? u.input_tokens ?? u.prompt ?? undefined;
      const completionTokens = u.completionTokens ?? u.completion_tokens ?? u.output_tokens ?? u.completion ?? undefined;
      const totalTokens = u.totalTokens ?? u.total_tokens ?? u.total ?? (typeof promptTokens === 'number' && typeof completionTokens === 'number' ? promptTokens + completionTokens : u.total ?? undefined);
      return { promptTokens, completionTokens, totalTokens };
    };

    // In error paths, callers often pass the raw model/server output as a string.
    // Store that as `rawOutput` so the Debug Panel can show it in the dedicated section.
    const rawOutput =
      typeof rawResponse === 'string'
        ? rawResponse
        : (rawResponse && typeof rawResponse?.raw === 'string')
          ? rawResponse.raw
          : undefined;

    // Preserve non-string objects for the "Raw Invalid Output" panel.
    const normalizedRawResponse = typeof rawResponse === 'string' ? undefined : rawResponse;

    set(state => ({
      isLoading: false,
      history: state.history.map(entry => {
        if (entry.id !== id) return entry;
        return {
          ...entry,
          status: 'error',
          error: error,
          rawResponse: normalizedRawResponse,
          rawOutput: rawOutput,
          tokenUsage: normalizeUsage(usage),
          latency: Date.now() - entry.timestamp
        };
      })
    }));
  },

  clearHistory: () => set({ history: [] }),

  validateKey: async (skipVerification?: boolean) => {
    const { provider, openaiKey, googleKey, startTransaction, completeTransaction, failTransaction } = get();
    const txId = startTransaction('KEY_VALIDATION');
    const apiKey = provider === 'openai' ? openaiKey : googleKey;
    
    if (!apiKey || apiKey.length < 5) {
        set({ isKeyValid: false, validationMessage: 'Key too short' });
        failTransaction(txId, 'Key too short');
        return;
    }

    // If skip verification is requested, mark as valid immediately
    if (skipVerification) {
        set({ isKeyValid: true, validationMessage: 'Verification skipped - key format appears valid' });
        completeTransaction(txId, { isValid: true, message: 'Verification skipped' });
        return;
    }

    try {
        const res = await fetch('/api/verify-key', {
          method: 'POST',
          body: JSON.stringify({ provider, apiKey }),
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        
        set({ isKeyValid: data.isValid, validationMessage: data.message });
        
        if (data.isValid) {
            completeTransaction(txId, data);
        } else {
            failTransaction(txId, data.message);
        }
    } catch (e: any) {
        set({ isKeyValid: false, validationMessage: 'Network error checking key' });
        failTransaction(txId, e.message || 'Network error');
    }
  },

  hasValidKey: () => get().isKeyValid
}));
