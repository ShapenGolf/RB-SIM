import type { SpecialCaseHandler } from "./types";

const MIGHTY_THRESHOLD = 5;

/**
 * When you play a [Mighty] unit, you may exhaust me to channel 1 rune exhausted. (A unit is
 * Mighty while it has 5+ Might.)
 *
 * Simplification: always exhausts to channel if eligible and not already exhausted (no real
 * downside — see docs/data-sourcing.md). Checks the played card's printed Might (not
 * battlefield-modified Might, since the unit isn't in play yet at the moment this fires).
 */
export const relentlessStorm: SpecialCaseHandler = {
  cardId: "relentless-storm",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type !== "unit" && playedCard.type !== "champion") return;
    if ((playedCard.might ?? 0) < MIGHTY_THRESHOLD) return;
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (!legend || legend.exhausted) return;
    legend.exhausted = true;
    const player = ctx.game.players[ctx.instance.controller];
    const rune = player.runeDeck.shift();
    if (rune) {
      rune.exhausted = true;
      player.runePool.push(rune);
    }
  },
};
