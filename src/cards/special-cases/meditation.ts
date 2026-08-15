import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] As an additional cost to play this, you may exhaust a friendly unit. If you do,
 * draw 2. Otherwise, draw 1.
 *
 * Simplification: no player choice of which unit to exhaust (see docs/data-sourcing.md) — always
 * exhausts the weakest ready friendly unit for the bigger draw, if one exists.
 */
export const meditation: SpecialCaseHandler = {
  cardId: "meditation",
  onPlay: (ctx) => {
    let weakest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller || instance.exhausted) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!weakest || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, weakest, "none")) {
        weakest = instance;
      }
    }
    const drawCount = weakest ? 2 : 1;
    if (weakest) weakest.exhausted = true;

    const player = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < drawCount; i += 1) {
      const drawn = player.mainDeck.shift();
      if (drawn) player.hand.push(drawn);
    }
  },
};
