import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * When I move to a battlefield, you may move an enemy unit to that battlefield.
 *
 * Simplification: the "may" auto-resolves to moving the first eligible enemy unit found
 * elsewhere (no real downside, same precedent as Zenith Blade — see docs/data-sourcing.md).
 */
export const irresistibleFaefolk: SpecialCaseHandler = {
  cardId: "irresistible-faefolk",
  onMove: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    const battlefieldIndex = ctx.instance.battlefieldIndex;
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";

    const mover = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== opponentId || i.battlefieldIndex === battlefieldIndex) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    if (!mover) return;

    if (mover.zone === "battlefield" && mover.battlefieldIndex !== null) {
      const oldSlot = ctx.game.battlefields[mover.battlefieldIndex];
      oldSlot.units[opponentId] = oldSlot.units[opponentId].filter((id) => id !== mover.instanceId);
    } else {
      const opponent = ctx.game.players[opponentId];
      opponent.base = opponent.base.filter((id) => id !== mover.instanceId);
    }
    mover.zone = "battlefield";
    mover.battlefieldIndex = battlefieldIndex;
    ctx.game.battlefields[battlefieldIndex].units[opponentId].push(mover.instanceId);
  },
};
