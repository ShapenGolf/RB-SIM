import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * Your Mechs each have [Assault]. (+1 Might while we're attackers.)
 * When I conquer, you may recycle another friendly unit to play a Mech from your trash. Reduce
 * its Energy cost by the Might of the unit you recycled.
 *
 * Known gap: the onConquer recycle-to-play-a-Mech clause isn't modeled (variable cost
 * reduction plus a choice of which trashed Mech to play — see docs/data-sourcing.md). Only the
 * static "Your Mechs have Assault" grant is implemented.
 */
export const rumbleHotheaded: SpecialCaseHandler = {
  cardId: "rumble-hotheaded",
  attackingMightBonusForAlly: (ctx, allyInstance) => {
    if (allyInstance.controller !== ctx.instance.controller) return 0;
    return (getCard(allyInstance.cardId).tags ?? []).includes("Mech") ? 1 : 0;
  },
};
