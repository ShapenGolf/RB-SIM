import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * I have +2 Might while I'm attacking with another unit.
 *
 * Approximated as "another friendly unit/champion is also at my Battlefield" (see
 * docs/data-sourcing.md) — the engine doesn't track which units were committed to the same
 * attack together once combat resolves, only where they currently sit.
 */
export const crimsonPigeons: SpecialCaseHandler = {
  cardId: "crimson-pigeons",
  attackingMightModifier: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return 0;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const hasAnotherUnit = (slot.units[ctx.instance.controller] ?? []).some((id) => {
      if (id === ctx.instance.instanceId) return false;
      const type = getCard(ctx.game.instances[id]?.cardId ?? "").type;
      return type === "unit" || type === "champion";
    });
    return hasAnotherUnit ? 2 : 0;
  },
};
