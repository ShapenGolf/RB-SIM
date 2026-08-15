import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import type { SpecialCaseHandler } from "./types";

/**
 * Each player chooses a unit they control. Kill the rest.
 *
 * Simplification: no player choice of which unit to keep (see docs/data-sourcing.md) — each
 * player automatically keeps their strongest unit (the strictly best choice for both sides).
 */
export const cataclysmicDuel: SpecialCaseHandler = {
  cardId: "cataclysmic-duel",
  onPlay: (ctx) => {
    for (const controller of ["0", "1"] as const) {
      const units = Object.values(ctx.game.instances).filter((i) => {
        if (i.controller !== controller) return false;
        const t = getCard(i.cardId).type;
        return t === "unit" || t === "champion";
      });
      if (units.length <= 1) continue;
      let keep = units[0];
      for (const u of units) {
        if (computeMight(ctx.game, getCard, u, "none") > computeMight(ctx.game, getCard, keep, "none")) keep = u;
      }
      for (const u of units) {
        if (u.instanceId !== keep.instanceId) destroyInstance(ctx.game, getCard, u.instanceId);
      }
    }
  },
};
