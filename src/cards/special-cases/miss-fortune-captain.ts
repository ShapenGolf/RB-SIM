import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/**
 * [Accelerate] [Ganking]
 * The first time I move each turn, you may ready something else that's exhausted.
 * Simplification: auto-picks the controller's own exhausted card (never an opponent's — no
 * player choice of which, see docs/data-sourcing.md); does nothing if none is available.
 */
export const missFortuneCaptain: SpecialCaseHandler = {
  cardId: "miss-fortune-captain",
  onMove: (ctx) => {
    if (ctx.instance.statuses.movedThisTurn) return;
    ctx.instance.statuses.movedThisTurn = true;
    const controller = ctx.instance.controller;
    const candidate = Object.values(ctx.game.instances).find(
      (i) => i.instanceId !== ctx.instance.instanceId && i.controller === controller && i.exhausted,
    );
    if (candidate) readyInstance(ctx.game, getCard, candidate.instanceId);
  },
};
