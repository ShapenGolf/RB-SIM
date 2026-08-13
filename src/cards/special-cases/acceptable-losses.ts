import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/**
 * Each player kills one of their gear.
 *
 * Simplification: no player choice of which gear (see docs/data-sourcing.md) — kills the
 * first gear instance found for each player.
 */
export const acceptableLosses: SpecialCaseHandler = {
  cardId: "acceptable-losses",
  onPlay: (ctx) => {
    for (const playerId of ["0", "1"] as const) {
      const gear = Object.values(ctx.game.instances).find(
        (i) => i.controller === playerId && getCard(i.cardId).type === "gear",
      );
      if (gear) destroyInstance(ctx.game, getCard, gear.instanceId);
    }
  },
};
