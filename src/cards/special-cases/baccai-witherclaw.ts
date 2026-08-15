import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 1 Energy+Rune+Rune (1 Energy+Rune+Rune: Empower me. Use only if not Empowered.)
 * [Empowered] I have +2 Might.
 * [Empowered][Deathknell] Channel 2 runes exhausted.
 */
export const baccaiWitherclaw: SpecialCaseHandler = {
  cardId: "baccai-witherclaw",
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 2 : 0),
  onDestroy: (ctx) => {
    if (!ctx.instance.statuses.empowered) return;
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const rune = player.runeDeck.shift();
      if (rune) {
        rune.exhausted = true;
        player.runePool.push(rune);
      }
    }
  },
};
