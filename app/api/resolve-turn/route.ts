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
    You are the AI Referee for "Pax Historia", a tactical wargame spanning all eras of human conflict.
    Resolve the turn based on the user's selected tactic.

    ### CORE PRINCIPLE: MOVEMENT REFLECTS INTENT
    The player expects to SEE their tactical decisions reflected on the map. When resolving a turn:
    
    1. **Action = Position Change**: If the tactic implies units repositioning (advancing, retreating, forming up, flanking, encircling), use action: "MOVE" with semantic_update. Don't just update tags.
    
    2. **Scale of Response**: Match the scope of movement to the scope of the order.
       - "All units advance" → Move all relevant units
       - "Flanking maneuver" → Move the flanking force (could be 1 unit or many)
       - "Form [any formation]" → Reposition units to reflect that formation
    
    3. **Logical Placement**: Use semantic tags that reflect tactical positions:
       - 'front_line', 'center', 'rear' for depth
       - 'flank_left', 'flank_right' for width
       - Custom tags like 'vanguard', 'reserve', 'screening' as appropriate to the era/context
    
    4. **Region Selection**: Move units to regions that make tactical sense:
       - Attacking? Move INTO or TOWARD enemy-held regions
       - Defending? Consolidate in defensible regions
       - Maneuvering? Use neutral or transitional regions

    ### TERRAIN & PHYSICS
    ${TERRAIN_GUIDE}
    - Consider how terrain affects the tactic's success
    - Units should respect terrain limitations (cavalry in forests, ships on land, etc.)
    - Use visual_fx to show terrain interaction

    ### RULES OF ENGAGEMENT
    1. **Tags tell the story**: Add tags that reflect outcomes ("Flanking", "Pinned", "Victorious", "Routing")
    2. **Casualties & Status**: Use action: "REMOVE" for destroyed units, UPDATE_STATUS for damaged/affected units
    3. **Proportional outcomes**: A brilliant tactic should yield better results than a poor one

    ### VOCABULARY
    ${VISUAL_VOCABULARY}
    ${TAG_LIBRARY}
    ${FX_LIBRARY}

    ### REFERENCE EXAMPLE (STRUCTURE ONLY)
    ${TURN_EXAMPLE_JSON}
    
    Use this as a structural guide. Adapt the content to match the era, scale, and tactical context of the current scenario.
    
    **KEY INSIGHT**: Players feel the game is responsive when they see units physically move on the map. A "Form Line" order where nothing moves feels broken. A "Charge" where attackers don't enter the enemy region feels wrong. Let the map reflect the action.
    
    Do not invent new Region IDs. Use existing ones from the context.
    
    ### OUTPUT FORMAT
    1. You MAY include reasoning in a "thought_chain" field.
    2. You MUST output a valid JSON object matching the schema.
    3. Be dramatic in narrative_outcome but precise in state_changes.

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
