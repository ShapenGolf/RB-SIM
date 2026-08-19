import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction][>] Rune Rune, Exhaust: [Add] 2 Energy. Spend this Energy only to play units or
 * activated abilities of units.
 *
 * [Add] itself is not the blocker (see dragonsoul-sage.ts and siblings) — this card's own cost is:
 * this engine's ActivatedAbilityCost (game/cards/special-cases/types.ts) supports at most ONE
 * power rune per cost (`runeDomain?: Domain`, paired with a single `powerRuneId` in
 * moves.ts's activateAbility/activateLegendAbility), not two. Approximating "Rune Rune" as 2
 * Energy instead would misrepresent the cost (Power is scarcer than Energy) rather than just
 * relaxing an unrelated restriction, so this stays unimplemented rather than modeled incorrectly.
 */
export const butcherOfTheSands: SpecialCaseHandler = {
  cardId: "butcher-of-the-sands",
};
