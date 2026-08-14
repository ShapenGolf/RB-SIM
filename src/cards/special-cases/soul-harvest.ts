import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";

const MAX_MIGHT = 3;

/** Kill a unit at a battlefield with 3 Might or less. */
export const soulHarvest: SpecialCaseHandler = {
  cardId: "soul-harvest",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield") return;
    if (computeMight(ctx.game, getCard, target, "none") > MAX_MIGHT) return;
    destroyInstance(ctx.game, getCard, targetInstanceId);
  },
};
