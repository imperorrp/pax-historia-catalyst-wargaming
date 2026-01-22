import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export function getModel(config: { provider?: 'openai' | 'google', apiKey?: string, model?: string }) {
  const provider = config.provider || 'openai';
  const apiKey = config.apiKey || (provider === 'google' ? process.env.GOOGLE_GENERATIVE_AI_API_KEY : process.env.OPENAI_API_KEY);
  
  let modelId = config.model;

  if (provider === 'google') {
    const google = createGoogleGenerativeAI({ apiKey });
    
    // Safety check: If model is explicitly OpenAI-like, force a Gemini fallback
    if (!modelId || modelId.startsWith('gpt')) {
        console.warn(`[getModel] Provider is Google but model is '${modelId}'. Fallback to 'gemini-1.5-pro'`);
        modelId = 'gemini-1.5-pro';
    }
    
    return google(modelId);
  } else {
    const openai = createOpenAI({ apiKey });
    
    // Safety check
    if (!modelId || modelId.startsWith('gemini')) {
        modelId = 'gpt-4o';
    }
    
    return openai(modelId);
  }
}
