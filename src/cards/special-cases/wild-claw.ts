import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";
import type { SpecialCaseHandler } from "./types";

/**
 * Look at the top 5 cards of your Main Deck. You may banish a unit or gear from among them and
 * play it, reducing its Energy cost by 5 Energy. Recycle the rest. Then you may do this: Empower
 * it. (It becomes Empowered if it's not already.)
 *
 * Simplification: the "-5 Energy" partial discount is approximated as playing it ignoring cost
 * entirely (no partial-cost-payment UI for a trigger-driven play — see docs/data-sourcing.md, the
 * same simplification used throughout this pool for trigger-driven plays). Both "may" clauses
 * auto-resolve yes when eligible (no real downside). No player choice of which of the 5 cards —
 * picks the priciest eligible one.
 */
export const wildClaw: SpecialCaseHandler = {
  cardId: "wild-claw",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const looked = player.mainDeck.splice(0, 5);
    let bestIdx = -1;
    let bestEnergy = -1;
    looked.forEach((id, idx) => {
      const c = getCard(id);
      if (c.type !== "unit" && c.type !== "champion" && c.type !== "gear") return;
      const energy = c.energyCost ?? 0;
      if (energy > bestEnergy) {
        bestEnergy = energy;
        bestIdx = idx;
      }
    });
    if (bestIdx === -1) {
      for (const cardId of looked) player.mainDeck.push(cardId);
      return;
    }
    const [chosen] = looked.splice(bestIdx, 1);
    for (const cardId of looked) player.mainDeck.push(cardId);

    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
    const newInstance = Object.values(ctx.game.instances).find(
      (i) => i.controller === ctx.instance.controller && i.cardId === chosen && i.zone === "base",
    );
    if (newInstance) newInstance.statuses.empowered = true;
  },
};
