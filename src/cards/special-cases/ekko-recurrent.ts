import type { SpecialCaseHandler } from "./types";

/** [Accelerate] [Deathknell] — Recycle me to ready your runes. */
export const ekkoRecurrent: SpecialCaseHandler = {
  cardId: "ekko-recurrent",
  recycleSelfOnDestroy: () => true,
  onDestroy: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    for (const rune of controller.runePool) rune.exhausted = false;
  },
};
