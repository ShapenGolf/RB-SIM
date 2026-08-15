import type { SpecialCaseHandler } from "./types";

/**
 * [Deflect]
 * The first time I win a combat each turn, you score 1 point.
 * When I die in combat, choose an opponent. They score 1 point.
 * Simplification: only the first clause is modeled — `onDestroy` doesn't distinguish a combat
 * death from any other death cause, so "when I die in combat" can't be checked precisely (see
 * docs/data-sourcing.md).
 */
export const dravenAudacious: SpecialCaseHandler = {
  cardId: "draven-audacious",
  onSurviveCombat: (ctx) => {
    if (ctx.instance.statuses.wonCombatThisTurn) return;
    ctx.instance.statuses.wonCombatThisTurn = true;
    ctx.game.players[ctx.instance.controller].points += 1;
  },
};
