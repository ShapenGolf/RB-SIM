import type { SpecialCaseHandler } from "./types";
import { banishInstance } from "./banish-helpers";

/**
 * When an opponent plays a gear, you may banish me to banish it. Always taken when able (a 1-for-1
 * removal trade for an enemy gear investment is close to strictly good — see docs/data-sourcing.md
 * no-real-choice simplification).
 */
export const ravenbloomPrefect: SpecialCaseHandler = {
  cardId: "ravenbloom-prefect",
  onEnemyCardPlayed: (ctx, playedCard, playedInstance) => {
    if (playedCard.type !== "gear") return;
    banishInstance(ctx.game, playedInstance);
    banishInstance(ctx.game, ctx.instance);
  },
};
