import { getCard } from "../db";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";
import { returnInstanceToHand } from "./bounce-helpers";

function might(instance: CardInstance): number {
  return getCard(instance.cardId).might ?? 0;
}

/**
 * You may play me to an open battlefield.
 * When you play me, you may return a non-Dragon unit to its owner's hand.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — always bounces
 * the strongest non-Dragon enemy unit found (the strictly beneficial choice), and does nothing
 * if none exists.
 */
export const oceanDrake: SpecialCaseHandler = {
  cardId: "ocean-drake",
  allowsPlayToOpenBattlefield: () => true,
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const candidates = Object.values(ctx.game.instances).filter((i) => {
      if (i.controller !== enemyId) return false;
      const c = getCard(i.cardId);
      if (c.type !== "unit" && c.type !== "champion") return false;
      return !(c.tags ?? []).includes("Dragon");
    });
    if (candidates.length === 0) return;
    candidates.sort((a, b) => might(b) - might(a));
    returnInstanceToHand(ctx.game, candidates[0].instanceId);
  },
};
