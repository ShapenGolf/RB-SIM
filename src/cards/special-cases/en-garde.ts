import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** Give a friendly unit +1 Might this turn, then an additional +1 Might this turn if it is the only unit you control there. */
export const enGarde: SpecialCaseHandler = {
  cardId: "en-garde",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.tempMightBonus += 1;

    const unitsHere = Object.values(ctx.game.instances).filter((i) => {
      if (i.controller !== target.controller || i.zone !== target.zone) return false;
      if (i.zone === "battlefield" && i.battlefieldIndex !== target.battlefieldIndex) return false;
      const card = getCard(i.cardId);
      return card.type === "unit" || card.type === "champion";
    });
    if (unitsHere.length === 1) target.tempMightBonus += 1;
  },
};
