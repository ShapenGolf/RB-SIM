import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/**
 * When you play me, ready another friendly Mech.
 *
 * Simplification: no player choice of which Mech (see docs/data-sourcing.md) — readies the
 * first one found.
 */
export const bubbleBot: SpecialCaseHandler = {
  cardId: "bubble-bot",
  onPlay: (ctx) => {
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.instanceId === ctx.instance.instanceId) return false;
      if (i.controller !== ctx.instance.controller) return false;
      return getCard(i.cardId).tags?.includes("Mech") ?? false;
    });
    if (target) readyInstance(ctx.game, getCard, target.instanceId);
  },
};
