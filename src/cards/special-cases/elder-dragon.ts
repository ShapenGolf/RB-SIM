import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * Any amount of your damage is enough to kill enemy units. / When you play me, choose up to one
 * enemy unit at each location. Deal 1 to them.
 *
 * Only the onPlay half is implemented — "any damage kills" is a cross-cutting rule change to
 * damage resolution, the same deferred class as Imperial Decree (see docs/data-sourcing.md).
 * "Each location" is approximated as each Battlefield (bases aren't usually called "locations"
 * in this context); no player choice of which enemy unit per location.
 */
export const elderDragon: SpecialCaseHandler = {
  cardId: "elder-dragon",
  onPlay: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    for (const slot of ctx.game.battlefields) {
      const targetId = slot.units[opponentId].find((id) => {
        const type = getCard(ctx.game.instances[id]?.cardId ?? "").type;
        return type === "unit" || type === "champion";
      });
      if (!targetId) continue;
      dealSpellDamage(ctx.game, getCard, targetId, 1, ctx.instance.controller);
    }
  },
};
