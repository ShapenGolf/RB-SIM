import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/**
 * At the start of your Beginning Phase, you may kill a unit you control here to draw 1.
 *
 * Simplification: no player choice of which unit (see docs/data-sourcing.md) — auto-takes the
 * trade only when a friendly unit is present here.
 */
export const duskRoseLab: SpecialCaseHandler = {
  cardId: "dusk-rose-lab",
  onEveryBeginningPhase: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const targetId = slot.units[ctx.instance.controller][0];
    if (!targetId) return;
    destroyInstance(ctx.game, getCard, targetId);
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
