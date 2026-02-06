import { getModel } from '@/lib/ai/server-utils';

export async function POST(req: Request) {
  try {
    const { provider, apiKey, skipVerification = false, selectedModel } = await req.json();

    if (!provider || !apiKey) {
      return new Response(JSON.stringify({ isValid: false, message: 'Missing credentials' }), { status: 400 });
    }

    // Option to skip verification for development or when quota is exceeded
    if (skipVerification) {
      return new Response(JSON.stringify({ isValid: true, message: 'Verification skipped' }), { status: 200 });
    }

    try {
        // For Google, use ListModels (single read call) to validate the key and check model capabilities.
        if (provider === 'google') {
          // Check if the API key format looks valid (Google API keys often start with specific prefixes)
          if (!apiKey.startsWith('AIza') && !apiKey.startsWith('GOOGLE_')) {
            return new Response(JSON.stringify({ isValid: false, message: 'Invalid Google API key format' }), { status: 401 });
          }

          // Call ListModels once to validate the key and inspect available models
          try {
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const text = await listRes.text();
            if (!listRes.ok) {
              // Try to surface quota/permission messages returned by Google
              const body = text || listRes.statusText;
              if (listRes.status === 403 || listRes.status === 429) {
                return new Response(JSON.stringify({ isValid: false, message: 'API quota or permission error: ' + body }), { status: 401 });
              }
              return new Response(JSON.stringify({ isValid: false, message: 'Failed to list Google models: ' + body }), { status: 401 });
            }

            const data = JSON.parse(text || '{}');
            const models = data.models || [];

            if (!selectedModel) {
              // If no specific model requested, the ability to call ListModels indicates the key is valid
              return new Response(JSON.stringify({ isValid: true, message: 'Key is valid (ListModels succeeded)' }), { status: 200 });
            }

            // Find a matching model entry. Model names come like 'models/gemini-2.5-flash-001'
            const match = models.find((m: any) => {
              const name = (m.name || '').replace(/^models\//, '');
              // Accept exact match or versioned match (selectedModel may be base id)
              return name === selectedModel || name.startsWith(selectedModel + '-') || (m.baseModelId && m.baseModelId === selectedModel);
            });

            if (!match) {
              return new Response(JSON.stringify({ isValid: false, message: `Model '${selectedModel}' not available for this key.` }), { status: 401 });
            }

            // Check supported generation methods for generateContent or generateMessage
            const supported = match.supportedGenerationMethods || [];
            const supportsGenerate = supported.includes('generateContent') || supported.includes('generateMessage');
            if (!supportsGenerate) {
              return new Response(JSON.stringify({ isValid: false, message: `Model '${selectedModel}' does not support content generation via this API.` }), { status: 401 });
            }

            return new Response(JSON.stringify({ isValid: true, message: `Key is valid and model '${selectedModel}' supports generation.` }), { status: 200 });
          } catch (err: any) {
            console.error('ListModels error:', err);
            const msg = err?.message || 'Failed to call ListModels';
            if (msg.includes('quota') || msg.includes('limit')) {
              return new Response(JSON.stringify({ isValid: false, message: 'API quota exceeded when calling ListModels. Check billing/quotas.' }), { status: 401 });
            }
            return new Response(JSON.stringify({ isValid: false, message: 'Failed to verify Google key: ' + msg }), { status: 401 });
          }
        }

        // OpenAI: do a single minimal generate to validate key
        // NOTE: OpenAI Responses API enforces a minimum `max_output_tokens` (>= 16),
        // so use 16 here to avoid validation errors while keeping the call small.
        const model = getModel({ provider: provider as 'openai' | 'google', apiKey, model: provider === 'openai' ? 'gpt-3.5-turbo' : 'gemini-2.0-flash-lite' });
        // Lightweight call to verify key - use a safe minimum of 16 tokens
        const { generateText } = await import('ai');
        await generateText({ model: model, prompt: 'Hi', maxOutputTokens: 16 });
        return new Response(JSON.stringify({ isValid: true, message: 'Key is valid' }), { status: 200 });
    } catch (e: any) {
        console.error("Validation failed:", e);
        
        // Provide more helpful error messages for common issues
        let errorMessage = e.message || 'Validation failed';
        
        if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
            errorMessage = 'API quota exceeded. Please check your billing plan or wait for quota reset.';
        } else if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid')) {
            errorMessage = 'Invalid API key. Please check your key and try again.';
        } else if (errorMessage.includes('PERMISSION_DENIED')) {
            errorMessage = 'API key does not have permission to access this service.';
        }
        
        return new Response(JSON.stringify({ isValid: false, message: errorMessage }), { status: 401 });
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ isValid: false, message: 'Server error' }), { status: 500 });
  }
}
