import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

const THRESHOLD = 5;

/** When you play me, draw 1 if your other units have total Might 5 or more. */
export const kinkouInitiate: SpecialCaseHandler = {
  cardId: "kinkou-initiate",
  onPlay: (ctx) => {
    let total = 0;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.instanceId === ctx.instance.instanceId || instance.controller !== ctx.instance.controller) continue;
      const type = getCard(instance.cardId).type;
      if (type !== "unit" && type !== "champion") continue;
      total += computeMight(ctx.game, getCard, instance, "none");
    }
    if (total < THRESHOLD) return;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
