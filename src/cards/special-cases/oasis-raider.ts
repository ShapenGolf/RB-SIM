import type { SpecialCaseHandler } from "./types";

/**
 * If you control fewer runes than an opponent at the start of your Beginning Phase, give me +2
 * Might and [Ganking] this turn.
 * The printed keyword list has an unconditional Ganking (importer artifact — see Brutal Hunter/
 * Kinkou Lifeblade in earlier batches) — overridden here via hasConditionalGanking, checked
 * against whether this turn's grant actually landed.
 */
export const oasisRaider: SpecialCaseHandler = {
  cardId: "oasis-raider",
  onBeginning: (ctx) => {
    const controller = ctx.instance.controller;
    const opponentId = controller === "0" ? "1" : "0";
    const myRunes = ctx.game.players[controller].runePool.length;
    const opponentRunes = ctx.game.players[opponentId].runePool.length;
    if (myRunes < opponentRunes) {
      ctx.instance.tempMightBonus += 2;
      ctx.instance.grantedThisTurn.push({ keyword: "ganking" });
    }
  },
  hasConditionalGanking: (ctx) => ctx.instance.grantedThisTurn.some((k) => k.keyword === "ganking"),
};
