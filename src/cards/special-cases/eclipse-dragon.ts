import type { SpecialCaseHandler } from "./types";

const RUNE_THRESHOLD = 4;

/** When I move, if you control 4 or fewer runes, draw 1. "Runes you control" = your Rune Pool (runes already channeled into play); the undrawn Rune Deck isn't "controlled" yet, same sense as an undrawn Main Deck card. */
export const eclipseDragon: SpecialCaseHandler = {
  cardId: "eclipse-dragon",
  onMove: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    if (player.runePool.length > RUNE_THRESHOLD) return;
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
