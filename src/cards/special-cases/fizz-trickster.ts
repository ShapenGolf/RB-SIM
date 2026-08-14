import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";

const MAX_ENERGY_COST = 3;

/**
 * When you play me, you may play a spell from your trash with Energy cost no more than 3
 * Energy, ignoring its Energy cost. Recycle that spell after you play it. (You must still pay
 * its Power cost.)
 *
 * Simplification: no player choice of which spell; playCardIgnoringCost also ignores Power cost
 * (see soulgorger.ts for the same simplification). "Recycle after playing" is approximated by
 * moving whatever a resolved spell just pushed onto the trash back into the Main Deck instead —
 * safe here since playCardIgnoringCost synchronously resolves exactly one spell.
 */
export const fizzTrickster: SpecialCaseHandler = {
  cardId: "fizz-trickster",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const player = ctx.game.players[controller];
    const idx = player.trash.findIndex((id) => {
      const card = getCard(id);
      return card.type === "spell" && card.energyCost !== null && card.energyCost <= MAX_ENERGY_COST;
    });
    if (idx === -1) return;
    const [chosen] = player.trash.splice(idx, 1);
    playCardIgnoringCost(ctx.game, controller, chosen);
    const trashIdx = player.trash.lastIndexOf(chosen);
    if (trashIdx !== -1) {
      player.trash.splice(trashIdx, 1);
      player.mainDeck.push(chosen);
    }
  },
};
