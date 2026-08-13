import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { playCardIgnoringCost } from "../../game/playFree";

/** At the end of your turn, reveal cards from the top of your Main Deck until you reveal a unit. Play it, ignoring its cost, and recycle the rest. */
export const dazzlingAurora: SpecialCaseHandler = {
  cardId: "dazzling-aurora",
  onEndOfTurn: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const recycled: string[] = [];
    let unitCardId: string | undefined;
    while (controller.mainDeck.length > 0) {
      const revealed = controller.mainDeck.shift()!;
      const type = getCard(revealed).type;
      if (type === "unit" || type === "champion") {
        unitCardId = revealed;
        break;
      }
      recycled.push(revealed);
    }
    controller.mainDeck.push(...recycled);
    if (unitCardId) playCardIgnoringCost(ctx.game, ctx.instance.controller, unitCardId);
  },
};
