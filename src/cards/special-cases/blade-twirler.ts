import type { SpecialCaseHandler } from "./types";

/**
 * The first time I move each turn, choose a player. They [Burn 1]. (They put the top card of
 * their Main Deck into their trash.)
 *
 * Simplification: no player choice of which player to target (see docs/data-sourcing.md) —
 * always targets the opponent, the strictly better choice (a controller would never willingly
 * burn their own deck here).
 */
export const bladeTwirler: SpecialCaseHandler = {
  cardId: "blade-twirler",
  onMove: (ctx) => {
    if (ctx.instance.statuses.movedThisTurn) return;
    ctx.instance.statuses.movedThisTurn = true;
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const enemy = ctx.game.players[enemyId];
    const burned = enemy.mainDeck.shift();
    if (burned) enemy.trash.push(burned);
  },
};
