import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { SpecialCaseEngine } from "./registry";
import { computeMight } from "../../game/might";
import { moveInstanceToBase } from "./move-helpers";

/**
 * When I attack, you may pay 1 Energy to move an enemy unit here to its base. Auto-targets the
 * weakest enemy unit at this location — no player choice of which one (see docs/data-sourcing.md).
 */
export const sinisterPoro: SpecialCaseHandler = {
  cardId: "sinister-poro",
  onAttack: (ctx) => {
    if (ctx.game.pendingOptionalCost) return;
    if (ctx.instance.battlefieldIndex === null) return;
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    if (slot.units[opponentId].length === 0) return;
    SpecialCaseEngine.offerOptionalCost(
      ctx.game,
      ctx.instance.controller,
      "sinister-poro",
      { energy: 1 },
      String(ctx.instance.battlefieldIndex),
    );
  },
  onOptionalCostPaid: (game, playerId, payload) => {
    if (payload === undefined) return;
    const battlefieldIndex = Number(payload);
    const opponentId = playerId === "0" ? "1" : "0";
    const slot = game.battlefields[battlefieldIndex];
    let weakest: string | undefined;
    let weakestMight = Infinity;
    for (const id of slot.units[opponentId]) {
      const inst = game.instances[id];
      const might = computeMight(game, getCard, inst, "none");
      if (might < weakestMight) {
        weakestMight = might;
        weakest = id;
      }
    }
    if (weakest) moveInstanceToBase(game, getCard, weakest);
  },
};
