import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";
import type { SpecialCaseHandler } from "./types";

/**
 * [Ganking] (generic keyword, already wired.)
 * When I conquer, you may play a spell from your trash with Energy cost less than your points
 * without paying its Energy cost. Then recycle it. (You must still pay its Power cost.)
 *
 * Simplification: the "may" always resolves yes when an eligible spell exists (no real
 * downside). playCardIgnoringCost also ignores Power cost, unlike the printed text (see
 * soulgorger.ts for the same simplification). No player choice of which spell (see
 * docs/data-sourcing.md) — plays the priciest eligible one.
 */
export const kaisaEvolutionary: SpecialCaseHandler = {
  cardId: "kaisa-evolutionary",
  onConquer: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    let bestIdx = -1;
    let bestEnergy = -1;
    player.trash.forEach((id, idx) => {
      const c = getCard(id);
      if (c.type !== "spell") return;
      const energy = c.energyCost ?? 0;
      if (energy >= player.points) return;
      if (energy > bestEnergy) {
        bestEnergy = energy;
        bestIdx = idx;
      }
    });
    if (bestIdx === -1) return;
    const [chosen] = player.trash.splice(bestIdx, 1);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
    if (player.trash[player.trash.length - 1] === chosen) {
      player.trash.pop();
      player.mainDeck.push(chosen);
    }
  },
};
