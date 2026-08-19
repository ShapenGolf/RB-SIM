import { addRuneToPool } from "../../game/templatedEffectEngine";
import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — [Add] 2 Energy. Use only to play spells.
 *
 * "Use only to play spells" isn't enforced — same unenforced-restriction direction as the rest of
 * this batch (see daughter-of-the-void.ts). Same [Reaction]-on-an-ability scope note as
 * dragonsoul-sage.ts.
 */
export const luxCrownguard: SpecialCaseHandler = {
  cardId: "lux-crownguard",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  onActivate: (ctx) => {
    addRuneToPool(ctx.game, ctx.instance.controller, "Colorless");
    addRuneToPool(ctx.game, ctx.instance.controller, "Colorless");
  },
};
