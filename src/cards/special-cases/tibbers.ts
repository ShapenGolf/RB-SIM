import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/** When you play me, deal 3 to all units at battlefields. */
export const tibbers: SpecialCaseHandler = {
  cardId: "tibbers",
  onPlay: (ctx) => {
    const targetIds = Object.values(ctx.game.instances)
      .filter((i) => i.zone === "battlefield" && i.instanceId !== ctx.instance.instanceId)
      .map((i) => i.instanceId);
    for (const id of targetIds) {
      if (!ctx.game.instances[id]) continue;
      dealSpellDamage(ctx.game, getCard, id, 3, ctx.instance.controller);
    }
  },
};
