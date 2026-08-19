import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — Pay any amount of Energy to [Add] that much Rune. (Abilities that add
 * resources can't be reacted to.)
 *
 * [Add] itself is NOT the blocker (see game/templatedEffectEngine.ts's addRuneToPool, used by
 * dragonsoul-sage.ts and siblings for cards with a FIXED Add amount) — the blocker here is the
 * variable, player-chosen "pay any amount" cost: this engine's activated-ability cost model
 * (ActivatedAbilityCost) has no way to express "however much the player wants to spend," and there
 * is no player-choice-of-amount UI anywhere in this engine to ask for it. Still a documented gap.
 */
export const ancientHenge: SpecialCaseHandler = {
  cardId: "ancient-henge",
};
