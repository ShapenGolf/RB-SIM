import { addRuneToPool } from "../../game/templatedEffectEngine";
import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction], [Legion] — [Add] 1 Energy. (Get the effect if you've played a card this
 * turn.)
 *
 * [Legion] (rule 812): the card doesn't even HAVE this ability unless another card has already
 * been Finalized (played) by its controller this turn — modeled by returning no cost at all
 * (`undefined`) when that condition isn't met, same as activatedAbilityCost's other state-gated
 * cards. Same [Reaction]-on-an-ability scope note as dragonsoul-sage.ts.
 */
export const handOfNoxus: SpecialCaseHandler = {
  cardId: "hand-of-noxus",
  activatedAbilityCost: (ctx) =>
    ctx.game.players[ctx.instance.controller].playedMainDeckCardThisTurn ? { energy: 0, exhaustSelf: true } : undefined,
  onActivate: (ctx) => {
    addRuneToPool(ctx.game, ctx.instance.controller, "Colorless");
  },
};
