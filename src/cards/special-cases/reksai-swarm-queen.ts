import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * When I attack, you may reveal the top 2 cards of your Main Deck. You may play one. Then
 * recycle the rest. If the played card is a unit, you may play it here.
 *
 * Simplification: both "may" clauses auto-resolve yes when a playable candidate exists (no real
 * downside — see docs/data-sourcing.md). Plays the card ignoring its cost, matching the
 * established simplification for trigger-driven plays elsewhere in this pool (see kharox.ts,
 * void-burrower.ts) — the printed text doesn't say "ignoring cost," but affordability isn't
 * checked at trigger time. No player choice of which of the 2 cards — picks the priciest
 * playable one.
 */
export const reksaiSwarmQueen: SpecialCaseHandler = {
  cardId: "reksai-swarm-queen",
  onAttack: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const revealed = player.mainDeck.splice(0, 2);
    let bestIdx = -1;
    let bestEnergy = -1;
    revealed.forEach((id, idx) => {
      const c = getCard(id);
      if (c.type !== "unit" && c.type !== "champion" && c.type !== "spell" && c.type !== "gear") return;
      const energy = c.energyCost ?? 0;
      if (energy > bestEnergy) {
        bestEnergy = energy;
        bestIdx = idx;
      }
    });
    if (bestIdx === -1) {
      for (const cardId of revealed) player.mainDeck.push(cardId);
      return;
    }
    const [chosen] = revealed.splice(bestIdx, 1);
    for (const cardId of revealed) player.mainDeck.push(cardId);

    const chosenCard = getCard(chosen);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
    if ((chosenCard.type === "unit" || chosenCard.type === "champion") && ctx.instance.battlefieldIndex !== null) {
      const newInstance = Object.values(ctx.game.instances).find(
        (i) => i.controller === ctx.instance.controller && i.cardId === chosen && i.zone === "base",
      );
      if (newInstance) moveInstanceToBattlefield(ctx.game, newInstance.instanceId, ctx.instance.battlefieldIndex);
    }
  },
};
