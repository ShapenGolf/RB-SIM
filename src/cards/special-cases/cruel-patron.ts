import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/**
 * As an additional cost to play me, kill a friendly unit.
 *
 * Approximated as a play-target effect (kill the chosen unit as this resolves) rather than a
 * true pre-payment cost gate — net board state is the same, and the engine has no "additional
 * cost requires a target" plumbing yet (see docs/data-sourcing.md).
 */
export const cruelPatron: SpecialCaseHandler = {
  cardId: "cruel-patron",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId || targetInstanceId === ctx.instance.instanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    const type = getCard(target.cardId).type;
    if (type !== "unit" && type !== "champion") return;
    destroyInstance(ctx.game, getCard, targetInstanceId);
  },
};
