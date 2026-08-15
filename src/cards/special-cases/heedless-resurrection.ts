import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import { playCardIgnoringCost } from "../../game/playFree";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] As an additional cost to play this, kill a friendly unit. Play a unit from your
 * trash that costs no more Energy and no more Power than the killed unit, ignoring its cost.
 *
 * The mandatory additional cost isn't validated at play time (this engine doesn't reject a play
 * when the mandatory cost can't be paid — see docs/data-sourcing.md). Simplification: no player
 * choice of which unit to kill (see docs/data-sourcing.md) — kills the controller's weakest
 * unit, then plays the priciest eligible unit from trash for maximum value.
 */
export const heedlessResurrection: SpecialCaseHandler = {
  cardId: "heedless-resurrection",
  onPlay: (ctx) => {
    let weakest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!weakest || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, weakest, "none")) {
        weakest = instance;
      }
    }
    if (!weakest) return;
    const killedCard = getCard(weakest.cardId);
    const maxEnergy = killedCard.energyCost ?? 0;
    const maxPower = killedCard.powerCost.reduce((sum, c) => sum + c.amount, 0);
    destroyInstance(ctx.game, getCard, weakest.instanceId);

    const player = ctx.game.players[ctx.instance.controller];
    let bestIdx = -1;
    let bestEnergy = -1;
    player.trash.forEach((id, idx) => {
      const c = getCard(id);
      if (c.type !== "unit" && c.type !== "champion") return;
      const power = c.powerCost.reduce((sum, cost) => sum + cost.amount, 0);
      if ((c.energyCost ?? 0) > maxEnergy || power > maxPower) return;
      if ((c.energyCost ?? 0) > bestEnergy) {
        bestEnergy = c.energyCost ?? 0;
        bestIdx = idx;
      }
    });
    if (bestIdx === -1) return;
    const [chosen] = player.trash.splice(bestIdx, 1);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
  },
};
