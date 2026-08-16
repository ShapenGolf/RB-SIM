import type { SpecialCaseHandler } from "./types";

/**
 * Order Rune: Ready me and give me +1 Might this turn. Use only if you've chosen an enemy unit
 * this turn and only once each turn.
 *
 * Moot — no generic "chosen as a target" broadcast exists (deferred, see jae-medarda.ts's
 * identical note). No fallback mode.
 */
export const hungryWolf: SpecialCaseHandler = {
  cardId: "hungry-wolf",
};
