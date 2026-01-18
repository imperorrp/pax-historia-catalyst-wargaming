import { generateObject } from 'ai';
import { ScenarioGenerationSchema } from '@/lib/ai/schemas';
import { getModel } from '@/lib/ai/server-utils';
import { 
  LAYOUT_GENERATION_RULES, 
  TERRAIN_GUIDE, 
  VISUAL_VOCABULARY,
  TAG_LIBRARY,
  SCENARIO_EXAMPLE_JSON
} from '@/lib/ai/knowledge-base';

export async function POST(req: Request) {
  const { prompt, provider, apiKey, model, systemPrompt: userSystemPrompt } = await req.json();

  const modelInstance = getModel({ provider, apiKey, model });

  const systemInstructions = `
      You are the Game Master for "Pax Historia", a tactical war game.
      Your job is to generate a balanced, historically plausible battlefield scenario.

      ### GEOMETRY RULES (CRITICAL)
      ${LAYOUT_GENERATION_RULES}
      ${TERRAIN_GUIDE}

      ### UNIT & LOGIC RULES
      ${TAG_LIBRARY}
      ${VISUAL_VOCABULARY}

      ### REFERENCE EXAMPLE (FOLLOW THIS STRUCTURE)
      ${SCENARIO_EXAMPLE_JSON}
      
      ${userSystemPrompt || ""}
    `;

  try {
    const result = await generateObject({
      model: modelInstance,
      schema: ScenarioGenerationSchema,
      system: systemInstructions,
      prompt: `Generate a scenario based on: "${prompt}". 
    Ensure the layout makes tactical sense (e.g., defenders on hills, rivers blocking paths).`,
    });

    return Response.json({
      ...result.object,
      _debug: {
        systemPrompt: systemInstructions,
        userPrompt: `Generate a scenario for: "${prompt}". Ensure units have valid region placements.`
      }
    });
  } catch (err: any) {
    console.error('[generate-scenario] Exception', err);
    return Response.json({
      error: err?.message || String(err),
      _debug: {
        systemPrompt: systemInstructions,
        userPrompt: `Generate a scenario for: "${prompt}". Ensure units have valid region placements.`
      }
    }, { status: 500 } as any);
  }
}
