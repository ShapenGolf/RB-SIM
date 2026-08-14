import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

/**
 * I can't be readied.
 * Chaos Rune: Move me to an occupied enemy battlefield if my Might is greater than the total
 * Might of enemy units there.
 *
 * Simplification: no player choice of which eligible enemy battlefield (see
 * docs/data-sourcing.md) — moves to the first one found.
 */
export const maduliTheGatekeeper: SpecialCaseHandler = {
  cardId: "maduli-the-gatekeeper",
  preventsSelfReady: () => true,
  activatedAbilityCost: { energy: 0, runeDomain: "Chaos", exhaustSelf: false },
  onActivate: (ctx) => {
    const myMight = computeMight(ctx.game, getCard, ctx.instance, "none");
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const destination = ctx.game.battlefields.findIndex((slot, index) => {
      if (index === ctx.instance.battlefieldIndex) return false;
      const enemyIds = slot.units[opponentId];
      if (enemyIds.length === 0) return false;
      const enemyTotal = enemyIds.reduce(
        (sum, id) => sum + computeMight(ctx.game, getCard, ctx.game.instances[id], "none"),
        0,
      );
      return myMight > enemyTotal;
    });
    if (destination === -1) return;

    if (ctx.instance.zone === "battlefield" && ctx.instance.battlefieldIndex !== null) {
      const oldSlot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
      oldSlot.units[ctx.instance.controller] = oldSlot.units[ctx.instance.controller].filter(
        (id) => id !== ctx.instance.instanceId,
      );
    } else {
      const controller = ctx.game.players[ctx.instance.controller];
      controller.base = controller.base.filter((id) => id !== ctx.instance.instanceId);
    }
    ctx.instance.zone = "battlefield";
    ctx.instance.battlefieldIndex = destination;
    ctx.game.battlefields[destination].units[ctx.instance.controller].push(ctx.instance.instanceId);
  },
};
