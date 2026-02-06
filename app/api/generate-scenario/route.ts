import { generateObject } from 'ai';
import { ScenarioGenerationSchema } from '@/lib/ai/schemas';
import { getModel } from '@/lib/ai/server-utils';
import { generatePaintedMap } from '@/lib/grid-engine/map-painter';
import { 
  LAYOUT_GENERATION_RULES, 
  TERRAIN_GUIDE, 
  VISUAL_VOCABULARY,
  TAG_LIBRARY,
  SCENARIO_EXAMPLE_JSON
} from '@/lib/ai/knowledge-base';

export async function POST(req: Request) {
  const { prompt, provider, apiKey, model, systemPrompt: userSystemPrompt } = await req.json();

  // 1. Secure Header Extraction (Optional fallback if not passed in body)
  const headerOpenAIKey = req.headers.get('x-openai-key') || undefined;
  const headerGoogleKey = req.headers.get('x-google-key') || undefined;
  
  // 2. Resolve final API key
  // Priority: Body (from Client Store) > Header > Env (handled by getModel)
  const resolvedApiKey = apiKey || (provider === 'google' ? headerGoogleKey : headerOpenAIKey);
  // Validate model/provider compatibility
  if (provider === 'google' && model && model.toLowerCase().includes('gpt')) {
    return Response.json({ error: `Selected model "${model}" appears to be an OpenAI model while provider is Google. Please choose a Google model (e.g., 'gemini-1.5-pro') or switch provider to 'openai'.` }, { status: 400 });
  }

  if (provider === 'openai' && model && model.toLowerCase().includes('gemini')) {
    return Response.json({ error: `Selected model "${model}" appears to be a Google model while provider is OpenAI. Please choose an OpenAI model (e.g., 'gpt-4o') or switch provider to 'google'.` }, { status: 400 });
  }
  const modelInstance = getModel({ provider, apiKey: resolvedApiKey, model });

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
      
      ### OUTPUT INSTRUCTIONS
      1. You MAY output a thinking process or reasoning text first.
      2. You MUST output the final result as a valid JSON object matching the schema.
      3. The JSON object must be the last thing you output.
      4. For every item in tactical_options[].compositeActions[] you MUST include these keys:
        - targetRegionId (string or null)
        - targetUnitId (string or null)
        - requiredUnitTypes (array; use [])
        - description (string or null)
      4. IMPORTANT: If you want to include reasoning/thoughts, you can EITHER:
         - Output text before the JSON (which will be captured as "raw output"), OR
         - Include a "thought_chain" field inside the JSON object itself.
         Both approaches are valid and will be logged for debugging.

      ${userSystemPrompt || ""}
    `;

  // Helper to normalize usage from different providers/SDKs
  const normalizeUsage = (u: Record<string, unknown> | null | undefined): { promptTokens: number; completionTokens: number; totalTokens: number } => {
    if (!u) return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const promptTokens = (u.promptTokens ?? u.prompt_tokens ?? u.input_tokens ?? u.prompt ?? 0) as number;
    const completionTokens = (u.completionTokens ?? u.completion_tokens ?? u.output_tokens ?? u.completion ?? 0) as number;
    const totalTokens = (u.totalTokens ?? u.total_tokens ?? u.total ?? (promptTokens + completionTokens)) as number;
    return { promptTokens, completionTokens, totalTokens };
  };

  try {
    const result = await generateObject({
      model: modelInstance,
      schema: ScenarioGenerationSchema,
      // mode: 'json', // Removed to allow Chain of Thought preamble
      system: systemInstructions,
      prompt: `Generate a scenario based on: "${prompt}". 
    Ensure the layout makes tactical sense (e.g., defenders on hills, rivers blocking paths).`,
      maxRetries: 0, // Fail fast and expose invalid output
    });
    
    const scenarioData = result.object;

    // 3. Server-Side Hydration (Map Painting)
    // The AI gives us layout DEFs (points/radii), we need to generate the actual polygon regions.
    const mapDimensions = { width: 1000, height: 800 }; // Default canvas size
    
    // Convert schema layout to internal layout defs
    const layoutDefs = (scenarioData.layout || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      terrain: l.terrain,
      seeds: 1, // Default
      influence: l.influence,
      points: l.points
    }));

    const hydratedRegions = generatePaintedMap(layoutDefs, mapDimensions.width, mapDimensions.height);

    const finalData = {
      ...scenarioData,
      id: crypto.randomUUID(), // Ensure ID
      mapRegions: hydratedRegions,
      layoutDefs: layoutDefs,
      mapDimensions: mapDimensions,
      playerPolity: scenarioData.playerPolity || "Player",
      enemyPolity: scenarioData.enemyPolity || "Enemy",
      // CRITICAL FIX: Map 'tactical_options' (AI Schema) to 'options' (App Type)
      options: scenarioData.tactical_options || [],
      // Ensure units is an array
      units: scenarioData.units || []
    };

    return Response.json({
      data: finalData,
      raw: JSON.stringify(scenarioData, null, 2),
      usage: normalizeUsage(result.usage),
      systemPrompt: systemInstructions,
      _debug: {
        systemPrompt: systemInstructions,
        userPrompt: `Generate a scenario for: "${prompt}". Ensure units have valid region placements.`
      }
    });

  } catch (err: any) {
    console.log("AI Output format warning, attempting repair...", err.message);

    const safeStringify = (value: unknown) => {
      try {
        const seen = new WeakSet<object>();
        return JSON.stringify(
          value,
          (_key, val) => {
            if (typeof val === 'object' && val !== null) {
              if (seen.has(val as object)) return '[Circular]';
              seen.add(val as object);
            }
            return val;
          },
          2
        );
      } catch {
        return undefined;
      }
    };

    // 1. Capture Raw Output
    const rawContent =
      err?.text ||
      err?.value ||
      (typeof err?.responseBody === 'string' ? err.responseBody : safeStringify(err?.responseBody)) ||
      (typeof err?.data === 'string' ? err.data : safeStringify(err?.data)) ||
      (typeof err?.cause?.responseBody === 'string' ? err.cause.responseBody : safeStringify(err?.cause?.responseBody)) ||
      err?.stack ||
      safeStringify(err) ||
      "";
    const usage = err.usage || { totalTokens: 0, promptTokens: 0, completionTokens: 0 };

    // 2. Extract JSON using Regex
    const jsonMatch = rawContent.match(/\{[\s\S]*\}$/);

    if (jsonMatch) {
      try {
        const repairedJson = JSON.parse(jsonMatch[0]);
        
        // HYDRATION LOGIC (Repeated for repair path)
        const mapDimensions = { width: 1000, height: 800 };
        const layoutDefs = (repairedJson.layout || []).map((l: any) => ({
          id: l.id,
          name: l.name,
          type: l.type,
          terrain: l.terrain,
          seeds: 1,
          influence: l.influence,
          points: l.points
        }));
        const hydratedRegions = generatePaintedMap(layoutDefs, mapDimensions.width, mapDimensions.height);
        
        const finalData = {
          ...repairedJson,
          id: crypto.randomUUID(),
          mapRegions: hydratedRegions,
          layoutDefs: layoutDefs,
          mapDimensions: mapDimensions,
          playerPolity: repairedJson.playerPolity || repairedJson.player_polity || "Player",
          enemyPolity: repairedJson.enemyPolity || repairedJson.enemy_polity || "Enemy",
          // CRITICAL FIX: Map 'tactical_options' (AI Schema) to 'options' (App Type)
          options: repairedJson.tactical_options || repairedJson.options || [],
          // Ensure units is an array
          units: repairedJson.units || []
        };

        return Response.json({
          data: finalData,
          raw: rawContent, // Full text including reasoning
          usage: normalizeUsage(usage),
          systemPrompt: systemInstructions,
          _repaired: true
        });
      } catch (parseErr) {
        console.error("Repair failed:", parseErr);
      }
    }

    console.error('[generate-scenario] Fail', err);
    return Response.json({
      error: err?.message || String(err),
      raw: rawContent,
      usage: normalizeUsage(usage as Record<string, unknown>),
      _debug: {
        systemPrompt: systemInstructions,
        userPrompt: `Generate a scenario for: "${prompt}". Ensure units have valid region placements.`
      }
    }, { status: 422 });
  }
}
