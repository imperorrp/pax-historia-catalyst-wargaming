import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export function getModel(config: { provider?: 'openai' | 'google', apiKey?: string, model?: string }) {
  const provider = config.provider || 'openai';
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY; // Fallback for OpenAI
  // Note: For Google, we look for process.env.GOOGLE_GENERATIVE_AI_API_KEY if using default, 
  // but if we use createGoogleGenerativeAI, we explicitly pass the key.

  if (provider === 'google') {
    const google = createGoogleGenerativeAI({
      apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    });
    return google(config.model || 'gemini-1.5-pro');
  } else {
    const openai = createOpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    });
    return openai(config.model || 'gpt-4o');
  }
}
