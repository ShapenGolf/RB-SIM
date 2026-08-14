import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * As an additional cost to play me, return a friendly gear to its owner's hand.
 *
 * Approximated as a play-target effect rather than a true pre-payment cost gate — same
 * simplification as Cruel Patron (see cards/special-cases/cruel-patron.ts).
 */
export const legionQuartermaster: SpecialCaseHandler = {
  cardId: "legion-quartermaster",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    if (getCard(target.cardId).type !== "gear") return;

    if (target.zone === "battlefield" && target.battlefieldIndex !== null) {
      const slot = ctx.game.battlefields[target.battlefieldIndex];
      slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    } else {
      const owner = ctx.game.players[target.controller];
      owner.base = owner.base.filter((id) => id !== targetInstanceId);
    }
    delete ctx.game.instances[targetInstanceId];
    ctx.game.players[target.controller].hand.push(target.cardId);
  },
};
