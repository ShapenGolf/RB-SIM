import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * Deal 2 to a unit. Deal 2 to a unit. Deal 2 to a unit. Deal 2 to a unit. Deal 2 to a unit.
 * Deal 2 to a unit.
 *
 * Simplification: the play-target picker only supports a single target per play (see
 * docs/data-sourcing.md), so all six instances of "deal 2" hit the one chosen target — a legal
 * (if conservative) real play, matching the same reasoning used for Singularity.
 */
export const icathianRain: SpecialCaseHandler = {
  cardId: "icathian-rain",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    for (let i = 0; i < 6; i += 1) {
      if (!ctx.game.instances[targetInstanceId]) break;
      dealSpellDamage(ctx.game, getCard, targetInstanceId, 2, ctx.instance.controller);
    }
  },
};
