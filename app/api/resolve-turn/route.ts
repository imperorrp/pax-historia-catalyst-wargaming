import { generateObject } from 'ai';
import { TurnResolutionSchema } from '@/lib/ai/schemas';
import { buildTurnPrompt } from '@/lib/ai/prompt-builder';
import { getModel } from '@/lib/ai/server-utils';
import { 
  VISUAL_VOCABULARY,
  TAG_LIBRARY,
  FX_LIBRARY,
  TURN_EXAMPLE_JSON 
} from '@/lib/ai/knowledge-base';

export async function POST(req: Request) {
  const { scenario, tactic, round, provider, apiKey, model, systemPrompt: userSystemPrompt } = await req.json();
  
  const prompt = buildTurnPrompt(scenario, tactic, round);
  const modelInstance = getModel({ provider, apiKey, model });

  const systemInstructions = `
    You are the AI Referee for "Pax Historia". 
    Resolve the turn based on the user's selected tactic.

    ### RULES OF ENGAGEMENT
    1. Update unit tags based on the narrative (e.g., if "Ambush" succeeds, add "Panicked" to enemy).
    2. Use 'semantic_update' to move units logically (e.g., attacking units move to 'front_line' of the target region).
    3. Generate Visual FX to tell the story.

    ### VOCABULARY
    ${VISUAL_VOCABULARY}
    ${TAG_LIBRARY}
    ${FX_LIBRARY}

    ### REFERENCE EXAMPLE (OUTPUT FORMAT)
    ${TURN_EXAMPLE_JSON}

    IMPORTANT: When moving units, use 'semantic_update' to place them logically (e.g. 'front_line' of 'region-1').
    Do not invent new Region IDs. Use existing ones from the context.

    ${userSystemPrompt || ""}
  `;

  try {
    const result = await generateObject({
      model: modelInstance,
      schema: TurnResolutionSchema,
      system: systemInstructions,
      prompt: prompt,
    });

    // Return both the logic payload AND the prompt (for the debug panel)
    // Also return the system prompt used so the user can see exactly what context was provided
    return Response.json({
      payload: result.object,
      prompt: prompt,
      systemPrompt: systemInstructions
    });
  } catch (err: any) {
    console.error('[resolve-turn] Exception', err);
    return Response.json({
      error: err?.message || String(err),
      prompt: prompt,
      systemPrompt: systemInstructions
    }, { status: 500 } as any);
  }
}
