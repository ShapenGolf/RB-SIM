import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/** Exhaust all friendly units, then deal 12 to ALL units at battlefields. */
export const uncheckedPower: SpecialCaseHandler = {
  cardId: "unchecked-power",
  onPlay: (ctx) => {
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const card = getCard(instance.cardId);
      if (card.type === "unit" || card.type === "champion") instance.exhausted = true;
    }
    const targets = Object.values(ctx.game.instances).filter((i) => i.zone === "battlefield");
    for (const target of targets) {
      dealSpellDamage(ctx.game, getCard, target.instanceId, 12, ctx.instance.controller);
    }
  },
};
