import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * [Action] This costs 2 Energy less if you control something that's [Empowered].
 * Deal 4 to a unit at a battlefield.
 */
export const shockBlast: SpecialCaseHandler = {
  cardId: "shock-blast",
  costReduction: (ctx) => {
    const hasEmpowered = Object.values(ctx.game.instances).some(
      (i) => i.controller === ctx.instance.controller && i.statuses.empowered,
    );
    return hasEmpowered ? 2 : 0;
  },
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield") return;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, 4, ctx.instance.controller);
  },
};
