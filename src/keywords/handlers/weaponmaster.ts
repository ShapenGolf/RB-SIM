import type { KeywordHandler } from "../types";
import { getCard } from "../../cards/db";
import { attachEquipment } from "../../game/equip";

/**
 * Weaponmaster: "When you play me, you may [Equip] one of your Equipment to me for [X] Rune
 * less, even if it's already attached."
 *
 * Simplification: no player choice of which Equipment (see docs/data-sourcing.md), and the
 * "for X Rune less" reduction is approximated as fully free — always attaches the first
 * friendly Equipment found (whether unattached or already worn by another unit), since the
 * "may" has no real downside here.
 */
export const weaponmasterHandler: KeywordHandler = {
  name: "weaponmaster",
  onPlay: (ctx) => {
    const gear = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      if (i.attachedTo === ctx.instance.instanceId) return false;
      return Boolean(getCard(i.cardId).equipCost);
    });
    if (!gear) return;
    attachEquipment(ctx.game, getCard, gear.instanceId, ctx.instance.instanceId);
  },
};
