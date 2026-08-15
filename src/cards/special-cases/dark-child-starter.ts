import type { SpecialCaseHandler } from "./types";

const READY_AMOUNT = 2;

/** At the end of your turn, ready 2 runes. */
export const darkChildStarter: SpecialCaseHandler = {
  cardId: "dark-child-starter",
  onEndOfTurn: (ctx) => {
    const toReady = ctx.game.players[ctx.instance.controller].runePool
      .filter((r) => r.exhausted)
      .slice(0, READY_AMOUNT);
    for (const rune of toReady) rune.exhausted = false;
  },
};
