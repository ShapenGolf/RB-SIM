import { getCard } from "../db";
import { moveInstanceToBase, moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] When you play me, you may choose a friendly unit. Move me to its location and it to
 * my original location.
 *
 * [Hidden]'s face-down timing isn't modeled. Simplification: no player choice of which unit —
 * picks the first other friendly unit found at a battlefield (swapping into base is a no-op for
 * this card's purpose).
 */
export const tideturner: SpecialCaseHandler = {
  cardId: "tideturner",
  onPlay: (ctx) => {
    const other = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller || i.instanceId === ctx.instance.instanceId) return false;
      if (i.zone !== "battlefield") return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (!other || other.battlefieldIndex === null) return;

    const myZone = ctx.instance.zone;
    const myIndex = ctx.instance.battlefieldIndex;
    const otherIndex = other.battlefieldIndex;

    moveInstanceToBattlefield(ctx.game, ctx.instance.instanceId, otherIndex);
    if (myZone === "battlefield" && myIndex !== null) {
      moveInstanceToBattlefield(ctx.game, other.instanceId, myIndex);
    } else {
      moveInstanceToBase(ctx.game, getCard, other.instanceId);
    }
  },
};
