import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * [Action] [Repeat] 2 Energy (You may pay the additional cost to repeat this spell's effect.)
 * Stun an attacking unit.
 *
 * [Repeat] isn't wired up (deliberately not built — see docs/data-sourcing.md) — only the base
 * single resolution is implemented. "Attacking" is a momentary combat-role concept this engine
 * doesn't persist outside combat resolution — approximated as any enemy unit at a battlefield
 * (established precedent, see existential-dread.ts).
 */
export const thwonk: SpecialCaseHandler = {
  cardId: "thwonk",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId || i.zone !== "battlefield") return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (target) target.statuses.stunned = true;
  },
};
