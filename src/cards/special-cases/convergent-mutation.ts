import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] Choose a friendly unit. This turn, increase its Might to the Might of another
 * friendly unit.
 *
 * Reaction timing isn't modeled — resolves immediately. Simplification: no player choice (see
 * docs/data-sourcing.md) — raises the controller's weakest unit up to the Might of their
 * strongest unit.
 */
export const convergentMutation: SpecialCaseHandler = {
  cardId: "convergent-mutation",
  onPlay: (ctx) => {
    let weakest: CardInstance | undefined;
    let strongest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      const might = computeMight(ctx.game, getCard, instance, "none");
      if (!weakest || might < computeMight(ctx.game, getCard, weakest, "none")) weakest = instance;
      if (!strongest || might > computeMight(ctx.game, getCard, strongest, "none")) strongest = instance;
    }
    if (!weakest || !strongest || weakest.instanceId === strongest.instanceId) return;
    const delta = computeMight(ctx.game, getCard, strongest, "none") - computeMight(ctx.game, getCard, weakest, "none");
    if (delta > 0) weakest.tempMightBonus += delta;
  },
};
