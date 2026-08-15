import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Accelerate]
 * Your conquer effects for conquering here trigger an additional time.
 * When I conquer, [Buff] a friendly unit.
 *
 * Known gap: "conquer effects trigger an additional time" (a location-wide re-trigger of every
 * onConquer hook) isn't modeled — only this card's own [Buff] trigger is implemented.
 * Simplification: no player choice of which unit to buff — picks the controller's strongest
 * ready unit without a buff already (see docs/data-sourcing.md).
 */
export const redBrambleback: SpecialCaseHandler = {
  cardId: "red-brambleback",
  onConquer: (ctx) => {
    let best: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (instance.statuses.buffed) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (instance.exhausted) continue;
      if (!best || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, best, "none")) {
        best = instance;
      }
    }
    if (best) best.statuses.buffed = true;
  },
};
