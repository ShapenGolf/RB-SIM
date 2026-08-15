import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { returnInstanceToHand } from "./bounce-helpers";
import type { SpecialCaseHandler } from "./types";

const MIGHT_CAP = 3;

/**
 * [Hidden] When you play me, you may return another unit at a battlefield with 3 Might or less
 * to its owner's hand.
 *
 * [Hidden]'s face-down timing isn't modeled. Simplification: the "may" always resolves yes when
 * an eligible unit exists (no real downside). No player choice — targets the strongest eligible
 * enemy unit; falls back to any eligible unit if no enemy qualifies.
 */
export const windsinger: SpecialCaseHandler = {
  cardId: "windsinger",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const candidates = Object.values(ctx.game.instances).filter((i) => {
      if (i.instanceId === ctx.instance.instanceId || i.zone !== "battlefield") return false;
      const t = getCard(i.cardId).type;
      if (t !== "unit" && t !== "champion") return false;
      return computeMight(ctx.game, getCard, i, "none") <= MIGHT_CAP;
    });
    const target = candidates.find((i) => i.controller === enemyId) ?? candidates[0];
    if (target) returnInstanceToHand(ctx.game, target.instanceId);
  },
};
