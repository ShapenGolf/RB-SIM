import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve.)
 * Counter a spell that costs no more than 4 Energy and no more than [X] Rune.
 *
 * Simplification: the exact Rune threshold was lost in text extraction (a bare "Rune" with no
 * number) — only the 4-Energy cap is enforced (same convention as spectral-matron.ts and its
 * siblings for the identical scraping artifact).
 */
export const defy: SpecialCaseHandler = {
  cardId: "defy",
  canCounterPending: (_ctx, pending) => {
    const cost = getCard(pending.cardId).energyCost;
    return cost !== null && cost <= 4;
  },
};
