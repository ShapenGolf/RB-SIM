import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** [Deathknell] — If I didn't die alone, draw 1. I wasn't alone if there were other friendly units here. */
export const loyalPoro: SpecialCaseHandler = {
  cardId: "loyal-poro",
  onDestroy: (ctx) => {
    const hasOtherFriendlyUnitHere = Object.values(ctx.game.instances).some((i) => {
      if (i.instanceId === ctx.instance.instanceId) return false;
      if (i.controller !== ctx.instance.controller || i.zone !== ctx.instance.zone) return false;
      if (i.zone === "battlefield" && i.battlefieldIndex !== ctx.instance.battlefieldIndex) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    if (!hasOtherFriendlyUnitHere) return;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
