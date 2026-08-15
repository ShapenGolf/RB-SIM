import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";

const MIGHT_THRESHOLD = 3;

/**
 * Choose a unit. If it's Empowered, disempower it. Then kill it if it has 3 Might or less.
 * Flow (play from trash) isn't wired up yet — see docs/data-sourcing.md; covers the baseline effect.
 */
export const lacerate: SpecialCaseHandler = {
  cardId: "lacerate",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    if (target.statuses.empowered) target.statuses.empowered = false;
    if (computeMight(ctx.game, getCard, target, "none") <= MIGHT_THRESHOLD) {
      destroyInstance(ctx.game, getCard, targetInstanceId);
    }
  },
};
