import type { SpecialCaseHandler } from "./types";

const MAX_RUNES = 2;

/** When you play me or another Dragon, ready up to 2 runes. */
export const gentleGemdragon: SpecialCaseHandler = {
  cardId: "gentle-gemdragon",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.id !== ctx.instance.cardId && !playedCard.tags?.includes("Dragon")) return;
    const player = ctx.game.players[ctx.instance.controller];
    const exhausted = player.runePool.filter((r) => r.exhausted).slice(0, MAX_RUNES);
    for (const rune of exhausted) rune.exhausted = false;
  },
};
