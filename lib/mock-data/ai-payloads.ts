import type { AIGameResponse } from "../types"
import { AUSTERLITZ_PAYLOADS } from "./ai-payloads/austerlitz"
import { BLITZKRIEG_PAYLOADS } from "./ai-payloads/blitzkrieg"
import { HYDASPES_PAYLOADS } from "./ai-payloads/hydaspes"
import { MEDIEVAL_SIEGE_PAYLOADS } from "./ai-payloads/medieval-siege"
import { RED_CLIFFS_PAYLOADS } from "./ai-payloads/red-cliffs"
import { TRAFALGAR_PAYLOADS } from "./ai-payloads/trafalgar"

export const SAMPLE_PAYLOADS: Record<string, AIGameResponse> = {
  ...AUSTERLITZ_PAYLOADS,
  ...BLITZKRIEG_PAYLOADS,
  ...HYDASPES_PAYLOADS,
  ...MEDIEVAL_SIEGE_PAYLOADS,
  ...RED_CLIFFS_PAYLOADS,
  ...TRAFALGAR_PAYLOADS,
}
