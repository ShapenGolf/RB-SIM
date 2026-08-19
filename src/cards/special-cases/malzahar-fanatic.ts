import { addRuneToPool } from "../../game/templatedEffectEngine";
import type { SpecialCaseHandler } from "./types";

const ADD_AMOUNT = 2;

/**
 * Kill a friendly unit or gear, Exhaust: [Action] — [Add] Rune Rune. (Use on your turn or in
 * showdowns. Abilities that add resources can't be reacted to.)
 *
 * [Add] itself is generic and already implemented for FIXED amounts (game/templatedEffectEngine.ts
 * addRuneToPool, used by dragonsoul-sage.ts and siblings) — ancient-henge.ts's "[Add] is
 * unimplemented" note only applies to a variable, player-chosen "pay any amount" cost, which
 * doesn't apply here (a flat 2). The "kill a friendly unit or gear" cost uses the new
 * ActivatedAbilityCost.killFriendlyUnitOrGear (game/moves.ts activateAbility), the "or gear"
 * generalization of the existing killFriendlyUnit (Empower-only) cost. Simplification: the added
 * Runes' domain defaults to this card's own printed domain (Mind) — the printed text is a bare,
 * domain-less "Rune Rune" with no stated choice mechanic.
 */
export const malzaharFanatic: SpecialCaseHandler = {
  cardId: "malzahar-fanatic",
  activatedAbilityCost: { energy: 0, exhaustSelf: true, killFriendlyUnitOrGear: true },
  onActivate: (ctx) => {
    for (let i = 0; i < ADD_AMOUNT; i += 1) {
      addRuneToPool(ctx.game, ctx.instance.controller, ctx.card.domains[0]);
    }
  },
};
