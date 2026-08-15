import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { SpecialCaseHandler } from "./types";

const MIGHTY_THRESHOLD = 5;

/** [Reaction] Draw 1 for each of your [Mighty] units (5+ Might). Reaction timing isn't modeled. */
export const showOfStrength: SpecialCaseHandler = {
  cardId: "show-of-strength",
  onPlay: (ctx) => {
    let mightyCount = 0;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (computeMight(ctx.game, getCard, instance, "none") >= MIGHTY_THRESHOLD) mightyCount += 1;
    }
    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < mightyCount; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
