import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/**
 * Kill a unit at a battlefield. Then, if it had 3 Might or less, you may play this from your
 * trash for Rune.
 *
 * Only the kill half is implemented — replaying itself from trash mid-resolution isn't modeled
 * (see docs/data-sourcing.md).
 */
export const deathFromBelow: SpecialCaseHandler = {
  cardId: "death-from-below",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield") return;
    destroyInstance(ctx.game, getCard, targetInstanceId);
  },
};
