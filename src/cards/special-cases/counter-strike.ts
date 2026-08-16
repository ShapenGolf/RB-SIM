import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] Choose a unit. The next time that unit would be dealt damage this turn, prevent it.
 * Draw 1.
 *
 * Reaction timing isn't modeled. Simplification: no player choice of which unit — protects the
 * controller's strongest friendly unit.
 */
export const counterStrike: SpecialCaseHandler = {
  cardId: "counter-strike",
  onPlay: (ctx) => {
    let target: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!target || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, target, "none")) {
        target = instance;
      }
    }
    if (target) target.statuses.preventNextDamage = true;

    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
