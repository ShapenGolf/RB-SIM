import type { SpecialCaseHandler } from "./types";

const RUNE_COST = 4;

/**
 * When you hold here, you may pay Rune Rune Rune Rune to score 1 point.
 *
 * "You may" with a real resource cost auto-resolves as always-yes when payable (established
 * precedent, see docs/data-sourcing.md) — skipped if the pool has fewer than 4 runes. Domain-less
 * Rune payment mirrors the powerRuneIds handling in game/moves.ts playCard: removed from the pool
 * and returned to the rune deck, no exhausted check (that's only for Energy-spent runes).
 * resolveHoldTriggers (game/combat.ts) now also fires onHold on the Battlefield's own card.
 */
export const powerNexus: SpecialCaseHandler = {
  cardId: "power-nexus",
  onHold: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    if (player.runePool.length < RUNE_COST) return;
    for (let i = 0; i < RUNE_COST; i += 1) {
      const rune = player.runePool.shift();
      if (rune) player.runeDeck.push(rune);
    }
    player.points += 1;
  },
};
