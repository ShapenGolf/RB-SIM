import type { SpecialCaseHandler } from "./types";

/**
 * [Level 3] I cost 2 Energy+Calm Rune less. [Level 6] 4 Energy+2 Calm Rune less instead.
 * [Level 11] 6 Energy+3 Calm Rune less instead.
 *
 * Simplification: only the Energy portion of each tier's reduction is applied (the Rune part
 * isn't modeled — same precedent as other Domain-Rune cost components, see
 * docs/data-sourcing.md).
 */
export const masterYiUnstoppable: SpecialCaseHandler = {
  cardId: "master-yi-unstoppable",
  costReduction: (ctx) => {
    const xp = ctx.game.players[ctx.instance.controller].xp;
    if (xp >= 11) return 6;
    if (xp >= 6) return 4;
    if (xp >= 3) return 2;
    return 0;
  },
};
