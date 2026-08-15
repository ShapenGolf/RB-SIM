import type { SpecialCaseHandler } from "./types";

/**
 * Each other player chooses Cards or Runes. For each player that chooses Cards, you and that
 * player each draw 1. For each player that chooses Runes, you and that player each channel 1
 * rune exhausted.
 *
 * Simplification: no player choice for the opponent (see docs/data-sourcing.md) — in this
 * 2-player engine there's exactly one other player, modeled as always choosing Cards (drawing
 * is the generically stronger option), so both players draw 1.
 */
export const partyFavors: SpecialCaseHandler = {
  cardId: "party-favors",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    for (const id of [ctx.instance.controller, enemyId] as const) {
      const player = ctx.game.players[id];
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
