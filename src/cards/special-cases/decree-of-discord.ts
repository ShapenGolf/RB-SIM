import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { returnInstanceToHand } from "./bounce-helpers";
import type { SpecialCaseHandler } from "./types";

const MIGHT_BUDGET = 5;

/**
 * Return any number of enemy Order units with total Might 5 or less to their owners' hands.
 *
 * Simplification: no player choice of which units (see docs/data-sourcing.md) — greedily
 * returns as many Order-domain enemy units as fit under the 5-Might budget, preferring higher
 * Might first (maximizes value returned).
 */
export const decreeOfDiscord: SpecialCaseHandler = {
  cardId: "decree-of-discord",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const candidates = Object.values(ctx.game.instances)
      .filter((i) => {
        if (i.controller !== enemyId) return false;
        const card = getCard(i.cardId);
        if (card.type !== "unit" && card.type !== "champion") return false;
        return card.domains.includes("Order");
      })
      .map((i) => ({ instance: i, might: computeMight(ctx.game, getCard, i, "none") }))
      .sort((a, b) => b.might - a.might);

    let remaining = MIGHT_BUDGET;
    for (const { instance, might } of candidates) {
      if (might > remaining) continue;
      remaining -= might;
      returnInstanceToHand(ctx.game, instance.instanceId);
    }
  },
};
