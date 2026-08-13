import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";
import { computeMight } from "../../game/might";

/**
 * Deal 3 to a unit. Deal 3 to a unit.
 *
 * Simplification: the engine's play-target picker only supports a single target per play (see
 * docs/data-sourcing.md), so both instances of "Deal 3 to a unit" are applied to the one chosen
 * target (6 total) rather than letting the player split them across two units.
 */
export const fallingStar: SpecialCaseHandler = {
  cardId: "falling-star",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.damage += 6;
    const toughness = computeMight(ctx.game, getCard, target, "none");
    if (target.damage >= toughness) {
      destroyInstance(ctx.game, getCard, targetInstanceId);
    }
  },
};
