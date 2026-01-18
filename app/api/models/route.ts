import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export async function GET(request: NextRequest) {
  try {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
    });

    // Get OpenAI models
    const openaiModels = await openai.models.list();

    // Get Google models - Use the REST API to list available models
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

    // Fallback to hardcoded models if API fails
    if (googleModels.length === 0) {
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

    return NextResponse.json({
      openai: openaiModels.map(model => model.id),
      google: googleModels
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}