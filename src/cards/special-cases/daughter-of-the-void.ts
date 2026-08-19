import { addRuneToPool } from "../../game/templatedEffectEngine";
import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — [Add] Rune. Use only to play spells.
 *
 * Domain: this Legend has two printed domains (Fury/Mind) — no domain-choice UI exists for
 * picking between them, so this defaults to the first (Fury), a documented simplification. The
 * "use only to play spells" restriction isn't enforced — the added Power is fully fungible, same
 * simplification direction as every other unenforced-restriction card in this batch (see
 * dragonsoul-sage.ts for the matching [Reaction]-on-an-ability note).
 */
export const daughterOfTheVoid: SpecialCaseHandler = {
  cardId: "daughter-of-the-void",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  onActivate: (ctx) => {
    addRuneToPool(ctx.game, ctx.instance.controller, ctx.card.domains[0]);
  },
};
