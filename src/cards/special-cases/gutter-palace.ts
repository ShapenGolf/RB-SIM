import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

const HAND_TARGET = 4;
const UNITS_TARGET = 4;

/**
 * At the start of your Beginning Phase, if you have exactly 4 cards in hand and exactly 4 units
 * at battlefields, you win the game.
 * Discard 1, Exhaust: Play a 1 Might Bird unit token with [Deflect].
 */
export const gutterPalace: SpecialCaseHandler = {
  cardId: "gutter-palace",
  onBeginning: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    if (player.hand.length !== HAND_TARGET) return;
    const unitsAtBattlefields = ctx.game.battlefields.reduce(
      (sum, slot) => sum + slot.units[ctx.instance.controller].length,
      0,
    );
    if (unitsAtBattlefields !== UNITS_TARGET) return;
    ctx.game.winner = ctx.instance.controller;
  },
  activatedAbilityCost: { energy: 0, exhaustSelf: true, discardCount: 1 },
  onActivate: (ctx) => {
    playTokenToBase(ctx.game, "token-bird-deflect", ctx.instance.controller);
  },
};
