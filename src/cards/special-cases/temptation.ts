import { getCard } from "../db";
import { moveInstanceToBattlefield } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * [Repeat] 2 Energy (You may pay the additional cost to repeat this spell's effect.) Move an
 * enemy unit to a location where there's a unit with the same controller.
 *
 * [Repeat] isn't wired up (~24 occurrences, deliberately not built — see docs/data-sourcing.md)
 * — only the base single resolution is implemented. Simplification: no player choice — picks the
 * first enemy unit not already sharing a battlefield with another enemy unit, and moves it to a
 * battlefield where one of their own units already is.
 */
export const temptation: SpecialCaseHandler = {
  cardId: "temptation",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let destinationIndex = -1;
    ctx.game.battlefields.forEach((slot, index) => {
      if (destinationIndex === -1 && slot.units[enemyId].length > 0) destinationIndex = index;
    });
    if (destinationIndex === -1) return;
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== enemyId) return false;
      const t = getCard(i.cardId).type;
      if (t !== "unit" && t !== "champion") return false;
      return !(i.zone === "battlefield" && i.battlefieldIndex === destinationIndex);
    });
    if (!target) return;
    moveInstanceToBattlefield(ctx.game, target.instanceId, destinationIndex);
  },
};
