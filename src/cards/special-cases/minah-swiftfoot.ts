import type { SpecialCaseHandler } from "./types";

/**
 * When I move to a battlefield, choose one — Each player discards 1. Each player draws 1.
 *
 * Simplification: no player choice of mode (see docs/data-sourcing.md) — always picks "Each
 * player draws 1", the safer default (a forced discard could hit either player's best card,
 * while a draw is uniformly fine).
 */
export const minahSwiftfoot: SpecialCaseHandler = {
  cardId: "minah-swiftfoot",
  onMove: (ctx) => {
    for (const id of ["0", "1"] as const) {
      const player = ctx.game.players[id];
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
