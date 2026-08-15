import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] Kill a friendly unit to give +Might equal to its Might to another friendly unit
 * this turn. Draw 1.
 *
 * Reaction timing isn't modeled — resolves immediately. Simplification: no player choice (see
 * docs/data-sourcing.md) — kills the controller's weakest unit (least value lost), gives the
 * Might to their strongest remaining unit.
 */
export const deathgrip: SpecialCaseHandler = {
  cardId: "deathgrip",
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
    if (weakest) {
      const might = computeMight(ctx.game, getCard, weakest, "none");
      const weakestId = weakest.instanceId;
      destroyInstance(ctx.game, getCard, weakestId);

      let strongest: CardInstance | undefined;
      for (const instance of Object.values(ctx.game.instances)) {
        if (instance.controller !== ctx.instance.controller || instance.instanceId === weakestId) continue;
        const t = getCard(instance.cardId).type;
        if (t !== "unit" && t !== "champion") continue;
        if (!strongest || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, strongest, "none")) {
          strongest = instance;
        }
      }
      if (strongest) strongest.tempMightBonus += might;
    }

    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
