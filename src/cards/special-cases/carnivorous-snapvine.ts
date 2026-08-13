import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";

/** When you play me, choose an enemy unit at a battlefield. We deal damage equal to our Mights to each other. */
export const carnivorousSnapvine: SpecialCaseHandler = {
  cardId: "carnivorous-snapvine",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller || target.zone !== "battlefield") return;

    const selfMight = computeMight(ctx.game, getCard, ctx.instance, "none");
    const targetMight = computeMight(ctx.game, getCard, target, "none");
    target.damage += selfMight;
    ctx.instance.damage += targetMight;

    if (target.damage >= computeMight(ctx.game, getCard, target, "none")) {
      destroyInstance(ctx.game, getCard, target.instanceId);
    }
    if (ctx.instance.damage >= computeMight(ctx.game, getCard, ctx.instance, "none")) {
      destroyInstance(ctx.game, getCard, ctx.instance.instanceId);
    }
  },
};
