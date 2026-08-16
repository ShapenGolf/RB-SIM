import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import { playCardIgnoringCost } from "../../game/playFree";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const LOOK_COUNT = 5;
const MIGHT_MARGIN = 1;

/**
 * 1 EnergyOrder Rune, Exhaust: Kill a friendly unit. Look at the top 5 cards of your Main Deck.
 * You may banish a unit from among them that has Might up to 1 more than the killed unit and
 * play it, ignoring its cost. Then recycle the rest.
 *
 * No player choice of which friendly unit to kill (established precedent, see docs/data-sourcing.
 * md) — kills the controller's own weakest other unit; the ability does nothing if none exists.
 * "May banish and play" auto-resolves yes when eligible — picks the priciest eligible card among
 * the 5 (mirrors wild-claw.ts's identical pattern).
 */
export const baitedHook: SpecialCaseHandler = {
  cardId: "baited-hook",
  activatedAbilityCost: { energy: 1, runeDomain: "Order", exhaustSelf: true },
  onActivate: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    let weakest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller || instance.instanceId === ctx.instance.instanceId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!weakest || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, weakest, "none")) {
        weakest = instance;
      }
    }
    if (!weakest) return;
    const killedMight = computeMight(ctx.game, getCard, weakest, "none");
    destroyInstance(ctx.game, getCard, weakest.instanceId);

    const looked = player.mainDeck.splice(0, LOOK_COUNT);
    let bestIdx = -1;
    let bestEnergy = -1;
    looked.forEach((id, idx) => {
      const c = getCard(id);
      if (c.type !== "unit" && c.type !== "champion") return;
      if ((c.might ?? 0) > killedMight + MIGHT_MARGIN) return;
      const energy = c.energyCost ?? 0;
      if (energy > bestEnergy) {
        bestEnergy = energy;
        bestIdx = idx;
      }
    });
    if (bestIdx === -1) {
      for (const cardId of looked) player.mainDeck.push(cardId);
      return;
    }
    const [chosen] = looked.splice(bestIdx, 1);
    for (const cardId of looked) player.mainDeck.push(cardId);
    playCardIgnoringCost(ctx.game, ctx.instance.controller, chosen);
  },
};
