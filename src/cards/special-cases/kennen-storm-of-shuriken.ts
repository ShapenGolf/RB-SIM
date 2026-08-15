import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, [Burn 2].
 * When I conquer, give a spell in your trash [Flow] equal to its cost this turn.
 * Simplification: only the Burn 2 on-play clause is modeled — granting temporary Flow to a
 * specific trash card needs a per-card, expiring keyword grant the engine doesn't support for
 * trashed (non-instance) cards yet (see docs/data-sourcing.md).
 */
export const kennenStormOfShuriken: SpecialCaseHandler = {
  cardId: "kennen-storm-of-shuriken",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 2; i += 1) {
      const burned = player.mainDeck.shift();
      if (burned) player.trash.push(burned);
    }
  },
};
