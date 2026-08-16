import { getCard } from "../db";
import { attachEquipment } from "../../game/equip";
import type { SpecialCaseHandler } from "./types";

/**
 * 1 Energy, Exhaust: Attach a detached Equipment you control to a unit you control.
 * Exhaust: Attach an attached Equipment you control to a unit you control.
 *
 * Known gap: this engine's activated-ability system supports one ability per card — only the
 * first (detached Equipment, 1 Energy) is implemented; the second (re-attach an already-attached
 * Equipment for free) is a documented gap (see docs/data-sourcing.md). No player choice of which
 * Equipment/unit — picks the first detached friendly Equipment and the first friendly unit found.
 */
export const grandmasterAtArms: SpecialCaseHandler = {
  cardId: "grandmaster-at-arms",
  activatedAbilityCost: { energy: 1, exhaustSelf: true },
  onActivate: (ctx) => {
    const gear = Object.values(ctx.game.instances).find(
      (i) => i.controller === ctx.instance.controller && getCard(i.cardId).type === "gear" && !i.attachedTo,
    );
    if (!gear) return;
    const unit = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (!unit) return;
    attachEquipment(ctx.game, getCard, gear.instanceId, unit.instanceId);
  },
};
