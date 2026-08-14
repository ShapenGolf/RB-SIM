import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

const MIGHT_PENALTY = 2;

/**
 * [Action] Choose a battlefield where you have units. You may move up to one enemy unit to that
 * battlefield. Then give enemy units there -2 Might this turn.
 *
 * Simplification: no separate battlefield-choice UI (see docs/data-sourcing.md) — the played
 * target is one of your own units at the battlefield, which also selects it. The "may move an
 * enemy unit" auto-resolves to moving the first eligible one found (no real downside, same
 * precedent as Zenith Blade).
 */
export const moonfall: SpecialCaseHandler = {
  cardId: "moonfall",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const anchor = ctx.game.instances[targetInstanceId];
    if (!anchor || anchor.controller !== ctx.instance.controller) return;
    if (anchor.zone !== "battlefield" || anchor.battlefieldIndex === null) return;
    const battlefieldIndex = anchor.battlefieldIndex;
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";

    const mover = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== opponentId || i.battlefieldIndex === battlefieldIndex) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    if (mover) {
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
    }

    const slot = ctx.game.battlefields[battlefieldIndex];
    for (const id of slot.units[opponentId]) {
      ctx.game.instances[id].tempMightBonus -= MIGHT_PENALTY;
    }
  },
};
