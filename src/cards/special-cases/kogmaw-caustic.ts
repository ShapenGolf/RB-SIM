import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealDistributedDamage } from "../../game/combat";

/** [Deathknell] — Deal 4 to all units at my battlefield. */
export const kogmawCaustic: SpecialCaseHandler = {
  cardId: "kogmaw-caustic",
  onDestroy: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    for (const playerId of ["0", "1"] as const) {
      for (const targetId of [...slot.units[playerId]]) {
        if (targetId === ctx.instance.instanceId) continue; // still mid-destruction, not yet removed
        dealDistributedDamage(ctx.game, getCard, [targetId], 4);
      }
    }
  },
};
