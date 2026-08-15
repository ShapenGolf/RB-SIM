import { getCard } from "../db";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 2;

/**
 * [Hidden] [Reaction] Choose a battlefield you control and a unit you control at a different
 * location. Move that unit to that battlefield and give it +2 Might this turn.
 *
 * [Hidden]'s face-down timing isn't modeled. Simplification: no player choice of which
 * battlefield/unit — picks the first battlefield the controller controls and moves the first
 * unit found elsewhere to it.
 */
export const resonatingStrike: SpecialCaseHandler = {
  cardId: "resonating-strike",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    const targetIndex = ctx.game.battlefields.findIndex((slot) => slot.controller === controller);
    if (targetIndex === -1) return;
    const unit = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== controller) return false;
      const t = getCard(i.cardId).type;
      if (t !== "unit" && t !== "champion") return false;
      return !(i.zone === "battlefield" && i.battlefieldIndex === targetIndex);
    });
    if (!unit) return;
    moveInstanceToBattlefield(ctx.game, unit.instanceId, targetIndex);
    unit.tempMightBonus += MIGHT_BONUS;
  },
};
