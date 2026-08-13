import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * Exhaust: Return another friendly gear, unit, or [Hidden] card to its owner's hand.
 *
 * The [Hidden] card option isn't reachable — the Hidden keyword (facedown play/reveal) isn't
 * modeled by this engine yet (~50 cards affected, tracked in docs/rules-reference.md).
 */
export const packOfWonders: SpecialCaseHandler = {
  cardId: "pack-of-wonders",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId || targetInstanceId === ctx.instance.instanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    const type = getCard(target.cardId).type;
    if (type !== "gear" && type !== "unit" && type !== "champion") return;

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
