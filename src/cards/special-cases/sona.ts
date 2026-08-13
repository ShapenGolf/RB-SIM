import type { SpecialCaseHandler } from "./types";

/** While I'm at a battlefield, ready 4 friendly runes at the end of your turn. */
export const sona: SpecialCaseHandler = {
  cardId: "sona",
  onEndOfTurn: (ctx) => {
    if (ctx.instance.zone !== "battlefield") return;
    const exhausted = ctx.game.players[ctx.instance.controller].runePool.filter((r) => r.exhausted);
    for (const rune of exhausted.slice(0, 4)) rune.exhausted = false;
  },
};
