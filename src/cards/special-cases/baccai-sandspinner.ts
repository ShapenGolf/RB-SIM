import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 5 Energy. This ability costs 3 Energy less if you control 4 or fewer runes.
 * [Empowered] I have [Deflect] and [Assault 2].
 * Known gap: Deflect stays unconditional (no override hook, same as other conditional-Deflect
 * cases this session). Assault 2 is cancelled while not Empowered — same Assault workaround as
 * the other conditional-Assault cases.
 */
export const baccaiSandspinner: SpecialCaseHandler = {
  cardId: "baccai-sandspinner",
  empowerCost: (ctx) => {
    const runeCount = ctx.game.players[ctx.instance.controller].runePool.length;
    return { energy: runeCount <= 4 ? 2 : 5 };
  },
  attackingMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 0 : -2),
};
