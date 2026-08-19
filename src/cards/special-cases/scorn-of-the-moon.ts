import { addRuneToPool } from "../../game/templatedEffectEngine";
import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction][>] Exhaust: [Add] 1 Energy. Spend this Energy only during showdowns.
 *
 * "Spend only during showdowns" isn't enforced — same unenforced-restriction direction as the
 * rest of this batch (see daughter-of-the-void.ts). Same [Reaction]-on-an-ability scope note as
 * dragonsoul-sage.ts.
 */
export const scornOfTheMoon: SpecialCaseHandler = {
  cardId: "scorn-of-the-moon",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  onActivate: (ctx) => {
    addRuneToPool(ctx.game, ctx.instance.controller, "Colorless");
  },
};
