import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";

/**
 * When I conquer, you may kill a gear with Energy cost no more than my Might.
 * Simplification: no player choice of which eligible gear (see docs/data-sourcing.md) — always
 * takes the option (strictly beneficial, removing an enemy's gear) and kills the first eligible
 * enemy gear found.
 */
export const noxianDemolitionist: SpecialCaseHandler = {
  cardId: "noxian-demolitionist",
  onConquer: (ctx) => {
    const myMight = computeMight(ctx.game, getCard, ctx.instance, "none");
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find(
      (i) => i.controller === opponentId && getCard(i.cardId).type === "gear" && (getCard(i.cardId).energyCost ?? 0) <= myMight,
    );
    if (target) destroyInstance(ctx.game, getCard, target.instanceId);
  },
};
