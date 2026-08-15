import type { SpecialCaseHandler } from "./types";

const ENERGY_THRESHOLD = 7;
const READY_AMOUNT = 2;

/**
 * When you play a unit, gear, or activated ability with Energy cost 7 Energy or more, you may
 * exhaust me to ready up to 2 runes.
 *
 * Known gap: the "or activated ability" trigger source isn't modeled (only card plays are
 * observable via onAllyCardPlayed — see docs/data-sourcing.md). Simplification: always exhausts
 * to ready if not already exhausted (no real downside).
 */
export const curatorOfTheSands: SpecialCaseHandler = {
  cardId: "curator-of-the-sands",
  onAllyCardPlayed: (ctx, playedCard) => {
    if (playedCard.type !== "unit" && playedCard.type !== "champion" && playedCard.type !== "gear") return;
    if ((playedCard.energyCost ?? 0) < ENERGY_THRESHOLD) return;
    const legend = ctx.game.players[ctx.instance.controller].legend;
    if (!legend || legend.exhausted) return;
    legend.exhausted = true;
    const toReady = ctx.game.players[ctx.instance.controller].runePool
      .filter((r) => r.exhausted)
      .slice(0, READY_AMOUNT);
    for (const rune of toReady) rune.exhausted = false;
  },
};
