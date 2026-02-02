import { generateObject, TypeValidationError } from 'ai';
import { TurnResolutionSchema } from '@/lib/ai/schemas';
import { buildTurnPrompt } from '@/lib/ai/prompt-builder';
import { getModel } from '@/lib/ai/server-utils';
import { 
  VISUAL_VOCABULARY,
  TAG_LIBRARY,
  FX_LIBRARY,
  TERRAIN_GUIDE,
  TURN_EXAMPLE_JSON 
} from '@/lib/ai/knowledge-base';

export async function POST(req: Request) {
  const body = await req.json();
  const { scenario, tactic, round, config } = body || {};

  // 1. Secure Header Extraction
  const headerOpenAIKey = req.headers.get('x-openai-key') || undefined;
  const headerGoogleKey = req.headers.get('x-google-key') || undefined;

  const provider = config?.provider || 'openai';
  const model = config?.model;
  const userSystemPrompt = config?.systemPrompt;

  // 2. Resolve Key based on Provider
  const apiKey = provider === 'google' ? headerGoogleKey : headerOpenAIKey;

  const prompt = buildTurnPrompt(scenario, tactic, round);
  
  // 3. Pass API Key explicitly to the model factory
  const modelInstance = getModel({ provider, apiKey, model });

  const systemInstructions = `
    You are the AI Referee for "Pax Historia". 
    Resolve the turn based on the user's selected tactic.

    ### TERRAIN & PHYSICS RULES (CRITICAL)
    ${TERRAIN_GUIDE}
    - MOVEMENT: Units cannot move through 'mountain' or 'ocean' unless they are naval.
    - DEFENSE: 'forest' and 'urban' provide defensive cover tags. 'mud' slows units.
    - VISUALS: Use visual_fx to show interaction with these terrains (e.g. MUD_SPLAT in swamps).

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
    
    ### OUTPUT FORMAT
    1. You MAY output a thinking process or reasoning text first to analyze the situation.
    2. You MUST output the final result as a valid JSON object matching the schema.
    3. The JSON object must be the last thing you output.
    4. IMPORTANT: If you want to include reasoning/thoughts, you can EITHER:
       - Output text before the JSON (which will be captured as "raw output"), OR
       - Include a "thought_chain" field inside the JSON object itself.
       Both approaches are valid and will be logged for debugging.

    ${userSystemPrompt || ""}
  `;

  // Normalize usage to consistent camelCase tokens (available to both try and catch)
  const normalizeUsage = (u: any) => {
    if (!u) return undefined;

    const resolvePath = (obj: any, path: string) => {
      try {
        return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
      } catch (e) {
        return undefined;
      }
    }

    const pickNumber = (...keys: string[]) => {
      for (const k of keys) {
        const v = resolvePath(u, k);
        if (typeof v === 'number') return v;
        if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
      }
      return undefined;
    }

    const promptTokens = pickNumber('promptTokens', 'prompt_tokens', 'input_tokens', 'prompt', 'token_usage.prompt_tokens', 'usage.prompt_tokens');
    const completionTokens = pickNumber('completionTokens', 'completion_tokens', 'output_tokens', 'completion', 'token_usage.output_tokens', 'usage.completion_tokens');
    const totalTokens = pickNumber('totalTokens', 'total_tokens', 'total', 'token_usage.total_tokens', 'usage.total_tokens') ??
                        (typeof promptTokens === 'number' && typeof completionTokens === 'number' ? promptTokens + completionTokens : undefined);

    if (promptTokens === undefined && completionTokens === undefined && totalTokens === undefined) return undefined;
    return { promptTokens, completionTokens, totalTokens };
  };

  try {
    const result = await generateObject({
      model: modelInstance,
      schema: TurnResolutionSchema,
      system: systemInstructions,
      prompt: prompt,
      // mode: 'json', // Removed to allow Chain of Thought preamble
      maxRetries: 0, // Fail fast and expose invalid output
    });

    // Success Case

    return Response.json({
      data: result.object,
      raw: JSON.stringify(result.object, null, 2),
      usage: normalizeUsage(result.usage),
      systemPrompt: systemInstructions,
      prompt: prompt
    });

  } catch (err: any) {
    console.log("AI Output format warning, attempting repair...", err.message);

    // 1. Capture Raw Output
    const rawContent = err.text || err.value || "";
    const usage = err.usage || undefined;

    // 2. Extract JSON using Regex
    const jsonMatch = rawContent.match(/\{[\s\S]*\}$/);

    if (jsonMatch) {
      try {
        const repairedJson = JSON.parse(jsonMatch[0]);
        return Response.json({
            data: repairedJson,
            raw: rawContent,
            usage: normalizeUsage(usage),
            systemPrompt: systemInstructions,
            prompt: prompt,
            _repaired: true
        });
      } catch (repairErr) {
        console.error("Repair failed:", repairErr);
      }
    }

    // Hard Failure
    return Response.json({
      error: "Failed to parse AI response. Validation/Parsing Failed.",
      details: err.message,
      raw: rawContent, 
      usage: normalizeUsage(usage),
      prompt: prompt,
      systemPrompt: systemInstructions
    }, { status: 422 });
  }
}
