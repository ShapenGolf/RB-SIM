import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";

const MAX_MIGHT = 3;

/**
 * When you play me, kill an enemy unit with 3 Might or less.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — kills the first
 * eligible enemy unit found.
 */
export const sandshifter: SpecialCaseHandler = {
  cardId: "sandshifter",
  onPlay: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== opponentId) return false;
      const type = getCard(i.cardId).type;
      if (type !== "unit" && type !== "champion") return false;
      return computeMight(ctx.game, getCard, i, "none") <= MAX_MIGHT;
    });
    if (!target) return;
    destroyInstance(ctx.game, getCard, target.instanceId);
  },
};
