import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { moveInstanceToBase } from "./move-helpers";

/**
 * Move a unit from a battlefield to its base.
 * Hidden (hide this now to react later for 0 Energy) isn't wired up yet — see
 * docs/data-sourcing.md; this covers the card's baseline effect when played normally from hand.
 */
export const fightOrFlight: SpecialCaseHandler = {
  cardId: "fight-or-flight",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    moveInstanceToBase(ctx.game, getCard, targetInstanceId);
  },
};
