import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/** [Reaction] Deal 1 to all units at battlefields. */
export const flurryOfBlades: SpecialCaseHandler = {
  cardId: "flurry-of-blades",
  onPlay: (ctx) => {
    const targets = Object.values(ctx.game.instances).filter((i) => i.zone === "battlefield");
    for (const target of targets) {
      dealSpellDamage(ctx.game, getCard, target.instanceId, 1, ctx.instance.controller);
    }
  },
};
