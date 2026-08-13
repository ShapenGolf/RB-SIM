import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

const MIGHTY_THRESHOLD = 5;

/** When you play me, draw 1 for each of your Mighty (5+ Might) units. */
export const kadregrin: SpecialCaseHandler = {
  cardId: "kadregrin",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    let mightyCount = 0;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const card = getCard(instance.cardId);
      if (card.type !== "unit" && card.type !== "champion") continue;
      if (computeMight(ctx.game, getCard, instance, "none") >= MIGHTY_THRESHOLD) mightyCount += 1;
    }
    for (let i = 0; i < mightyCount; i += 1) {
      const drawn = controller.mainDeck.shift();
      if (drawn) controller.hand.push(drawn);
    }
  },
};
