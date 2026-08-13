import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * When a buffed friendly unit dies, buff another friendly unit.
 *
 * Simplification: no player choice of which unit to buff (see docs/data-sourcing.md) — picks
 * the first other friendly unit found.
 */
export const vanguardHelm: SpecialCaseHandler = {
  cardId: "vanguard-helm",
  onAllyUnitDied: (ctx, died) => {
    if (!died.statuses.buffed) return;
    const other = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (other) other.statuses.buffed = true;
  },
};
