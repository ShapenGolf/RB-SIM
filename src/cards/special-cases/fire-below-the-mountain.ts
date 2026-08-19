import { addRuneToPool } from "../../game/templatedEffectEngine";
import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — [Add] Rune. Use only to play gear or use gear abilities.
 *
 * Same domain-choice-defaults-to-first-printed-domain (Calm) and unenforced-restriction scope
 * notes as daughter-of-the-void.ts.
 */
export const fireBelowTheMountain: SpecialCaseHandler = {
  cardId: "fire-below-the-mountain",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  onActivate: (ctx) => {
    addRuneToPool(ctx.game, ctx.instance.controller, ctx.card.domains[0]);
  },
};
