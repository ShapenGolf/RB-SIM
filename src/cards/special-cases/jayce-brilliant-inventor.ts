import { getCard } from "../db";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * When you play me or the first time you play a non-token gear each turn, you may ready
 * something besides me that's exhausted.
 *
 * Known gap: "the first time you play a non-token gear each turn" isn't tracked (no per-turn
 * "first gear played" flag — see docs/data-sourcing.md); only the "when you play me" trigger is
 * implemented. Simplification: no player choice of what to ready (see docs/data-sourcing.md) —
 * readies the strongest exhausted friendly unit/champion found.
 */
export const jayceBrilliantInventor: SpecialCaseHandler = {
  cardId: "jayce-brilliant-inventor",
  onPlay: (ctx) => {
    let best: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller || instance.instanceId === ctx.instance.instanceId) continue;
      if (!instance.exhausted) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!best || (getCard(instance.cardId).might ?? 0) > (getCard(best.cardId).might ?? 0)) best = instance;
    }
    if (best) best.exhausted = false;
  },
};
