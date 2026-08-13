import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/**
 * Each player kills one of their units.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — kills the
 * first unit instance found for each player.
 */
export const cullTheWeak: SpecialCaseHandler = {
  cardId: "cull-the-weak",
  onPlay: (ctx) => {
    for (const playerId of ["0", "1"] as const) {
      const unit = Object.values(ctx.game.instances).find((i) => {
        if (i.controller !== playerId) return false;
        const t = getCard(i.cardId).type;
        return t === "unit" || t === "champion";
      });
      if (unit) destroyInstance(ctx.game, getCard, unit.instanceId);
    }
  },
};
