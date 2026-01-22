import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 1) OpenAI models via REST (official endpoint)
    let openaiModels: string[] = [];
    try {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${openaiKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          openaiModels = (data.data || []).map((m: any) => m.id).filter(Boolean);
        } else {
          console.warn('[api/models] OpenAI models fetch returned', res.status);
        }
      } else {
        console.warn('[api/models] OPENAI_API_KEY not set; skipping OpenAI model listing');
      }
    } catch (err) {
      console.error('Error fetching OpenAI models:', err);
    }

    // 2) Google models - Use the REST API to list available models
    let googleModels: string[] = [];
    try {
      const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (googleApiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${googleApiKey}`);
        if (response.ok) {
          const data = await response.json();
          googleModels = data.models?.map((model: any) => model.name.replace('models/', '')) || [];
        }
      }
    } catch (error) {
      console.error('Error fetching Google models:', error);
    }

    // Fallbacks if lists are empty
    if (!openaiModels || openaiModels.length === 0) {
      openaiModels = ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini'];
    }
    if (!googleModels || googleModels.length === 0) {
      googleModels = [
        'gemini-3-pro-preview',
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite'
      ];
    }

    return NextResponse.json({ openai: openaiModels, google: googleModels });
  } catch (error) {
    console.error('Error in /api/models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}